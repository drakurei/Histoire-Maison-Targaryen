// Tests du Command Center dans un navigateur réel (Playwright + Chromium).
// Les tests tournent sur une COPIE du dossier command-center : l'état réel du projet n'est jamais modifié.
// Usage : node tests/functional/command-center.test.mjs   (Playwright doit être installé)

import { spawn, spawnSync, execFile } from 'node:child_process';
import { cp, mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { createRequire } from 'node:module';

// Playwright est résolu comme un module CommonJS (installation locale ou globale).
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = 4799;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = path.join(ROOT, 'tests', 'visual', 'command-center');
const WIDTHS = [360, 390, 768, 1024, 1280, 1920];
const VIEWS = ['', 'agents', 'taches', 'decisions', 'problemes', 'rapports', 'journal'];

const results = [];
function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? 'OK   ' : 'ÉCHEC'} ${name}${detail ? ` — ${detail}` : ''}`);
}

/** Requête HTTP brute (permet de forger l'en-tête Host). */
function raw({ method = 'GET', url, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, path: url, method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const sandbox = await mkdtemp(path.join(tmpdir(), 'tcc-test-'));
await cp(path.join(ROOT, 'command-center'), path.join(sandbox, 'command-center'), { recursive: true });
await mkdir(path.join(sandbox, 'reports', 'agent-reports'), { recursive: true });
await writeFile(path.join(sandbox, 'reports', 'agent-reports', 'exemple.md'), '# Rapport de test\n\nTexte **gras** et `code`.\n\n| A | B |\n|---|---|\n| 1 | <script>alert(1)</script> |\n');
// État vierge : les tests ne dépendent pas de l'avancement réel du projet.
for (const file of [['orchestration', 'inbox'], ['orchestration', 'state.json'], ['events', 'events.jsonl']]) await rm(path.join(sandbox, 'command-center', ...file), { recursive: true, force: true });

const orchestrate = (...args) => spawnSync('node', [path.join(sandbox, 'command-center', 'orchestration', 'orchestrate.mjs'), ...args], { encoding: 'utf8' });
const readState = async () => JSON.parse(await readFile(path.join(sandbox, 'command-center', 'orchestration', 'state.json'), 'utf8'));

orchestrate('init');
const decisionId = orchestrate('decision', 'add', 'validation', '01', 'Validation de test', '::', 'Détail de test').stdout.trim();
orchestrate('issue', 'open', '13', 'majeur', 'Problème de test', '::', 'Détail');

const server = spawn('node', [path.join(sandbox, 'command-center', 'application', 'server.mjs')], { env: { ...process.env, TCC_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => {
  server.stdout.on('data', (chunk) => { if (String(chunk).includes('http://')) resolve(); });
  server.stderr.on('data', (chunk) => reject(new Error(String(chunk))));
});

const browser = await chromium.launch();
try {
  /* --- Sécurité du serveur --- */
  const address = server.spawnargs && (await raw({ url: '/api/state', headers: { Host: `127.0.0.1:${PORT}` } }));
  check('API /api/state répond', address.status === 200);
  check('En-tête Host étranger refusé (anti DNS rebinding)', (await raw({ url: '/api/state', headers: { Host: 'evil.example' } })).status === 403);
  const post = (body, headers = {}) => raw({ method: 'POST', url: '/api/command', headers: { Host: `127.0.0.1:${PORT}`, 'Content-Type': 'application/json', ...headers }, body });
  check('Origine étrangère refusée', (await post('{"type":"project.pause"}', { Origin: 'https://evil.example' })).status === 403);
  check('Type de contenu non JSON refusé', (await post('{"type":"project.pause"}', { 'Content-Type': 'text/plain' })).status === 415);
  check('Commande inconnue refusée', (await post('{"type":"shell.exec"}')).status === 400);
  check('Type de commande en tableau refusé (constat A14-005)', (await post('{"type":["project.pause"]}')).status === 400);
  check('Type de contenu approchant refusé (A14-014)', (await post('{"type":"project.pause"}', { 'Content-Type': 'application/jsonx' })).status === 415);
  await symlink(path.join(sandbox, 'command-center', 'orchestration', 'state.json'), path.join(sandbox, 'reports', 'fuite.md'));
  check('Lien symbolique sortant du dossier des rapports refusé (A14-013)', (await raw({ url: '/api/report?path=fuite.md', headers: { Host: `127.0.0.1:${PORT}` } })).status === 403);
  check('Clé de prototype refusée', (await post('{"type":"constructor"}')).status === 400);
  check('Agent inconnu refusé', (await post('{"type":"agent.pause","target":"99"}')).status === 400);
  check('Motif obligatoire exigé', (await post('{"type":"agent.improve","target":"04"}')).status === 400);
  check('Corps trop volumineux : réponse 413', (await post(JSON.stringify({ type: 'project.pause', note: 'x'.repeat(20000) }))).status === 413);
  check('Traversée de chemin refusée', [400, 403].includes((await raw({ url: `/api/report?path=${encodeURIComponent('../command-center/orchestration/state.md')}`, headers: { Host: `127.0.0.1:${PORT}` } })).status));
  check('Fichier hors liste blanche introuvable', (await raw({ url: '/server.mjs', headers: { Host: `127.0.0.1:${PORT}` } })).status === 404);
  check('CSP présente', String(address.headers['content-security-policy']).includes("default-src 'none'"));
  check('Aucune commande parasite enregistrée', (await raw({ url: '/api/state', headers: { Host: `127.0.0.1:${PORT}` } }).then((r) => JSON.parse(r.body).commands.length)) === 0);

  /* --- Règles de l'orchestrateur (constats A14-006 et A14-007) --- */
  check('Clôture refusée pour une tâche non démarrée', orchestrate('task', 'B9', 'done', 'ok').status !== 0);
  orchestrate('task-add', JSON.stringify({ id: 'T1', phase: 'A', agent: '01', title: 'Tâche de test', dependsOn: ['B9'] }));
  orchestrate('task', 'T1', 'in_progress');
  check('Clôture refusée si une dépendance est ouverte', orchestrate('task', 'T1', 'done', 'ok').status !== 0);
  const cli = path.join(sandbox, 'command-center', 'orchestration', 'orchestrate.mjs');
  const issuesBefore = (await readState()).issues.length;
  await Promise.all(Array.from({ length: 12 }, (_, index) => new Promise((resolve) => execFile('node', [cli, 'issue', 'open', '13', 'mineur', `Concurrent ${index}`], resolve))));
  const issuesAfter = (await readState()).issues;
  check('12 écritures simultanées : aucune perdue, identifiants uniques', issuesAfter.length === issuesBefore + 12 && new Set(issuesAfter.map((issue) => issue.id)).size === issuesAfter.length, `${issuesAfter.length - issuesBefore} conservées`);

  /* --- Interface --- */
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto(`${BASE}/#/agents`);
  await page.waitForSelector('.agent');
  check('14 agents affichés', (await page.locator('.agent').count()) === 14);
  check('Agents 02 à 14 « jamais exécutés » tant qu\'aucun sous-agent n\'a tourné', (await page.locator('.agent--never').count()) === 13);

  await page.click('[data-agent="04"]');
  await page.waitForSelector('#agent-dialog[open]');
  check('Fiche agent : mission, objectifs, périmètre', (await page.locator('#agent-dialog').innerText()).toLowerCase().includes('objectifs mesurables'));
  await page.click('#agent-dialog [data-type="agent.pause"]');
  await page.waitForSelector('#agent-dialog [data-type="agent.pause"][disabled]');
  check('Pause agent : demande en attente affichée', true);
  let state = await readState();
  check("Pause non effective avant le checkpoint (pas de fausse promesse)", !state.control.pausedAgents.includes('04'));
  orchestrate('checkpoint');
  state = await readState();
  check('Pause effective après le checkpoint', state.control.pausedAgents.includes('04') && state.agents['04'].status === 'paused');
  check("Lancement d'un agent en pause refusé par l'orchestrateur", orchestrate('run', 'start', '04', 'B1', 'test').status !== 0);
  await page.waitForSelector('#agent-dialog [data-type="agent.resume"]', { timeout: 10000 });
  check("L'interface reflète la pause appliquée", true);

  await page.click('#agent-dialog [data-type="agent.reevaluate"]');
  await page.waitForSelector('#note-dialog[open]');
  await page.click('#note-submit');
  check('Réévaluation sans motif bloquée', await page.locator('#note-dialog[open]').count() === 1);
  await page.fill('#note-input', 'Vérifier de nouveau les déclinaisons.');
  await page.click('#note-submit');
  await page.waitForSelector('#note-dialog:not([open])', { state: 'attached' });
  orchestrate('checkpoint');
  state = await readState();
  check('Demande de réévaluation inscrite pour l\'agent', state.control.requests.some((request) => request.agent === '04' && request.note.includes('déclinaisons')));
  await page.click('#agent-dialog [data-action="close-dialog"]');

  await page.goto(`${BASE}/#/decisions`);
  await page.waitForSelector(`[data-type="decision.approve"][data-target="${decisionId}"]`);
  await page.click(`[data-type="decision.approve"][data-target="${decisionId}"]`);
  await page.waitForSelector('#note-dialog[open]');
  await page.click('#note-submit');
  await page.waitForSelector('#note-dialog:not([open])', { state: 'attached' });
  orchestrate('checkpoint');
  state = await readState();
  check('Validation enregistrée après checkpoint', state.decisions.find((decision) => decision.id === decisionId).status === 'approved');

  await page.click('#global-controls [data-type="project.pause"]');
  await page.waitForSelector('#global-controls [data-type="project.pause"][disabled]');
  const checkpoint = orchestrate('checkpoint');
  state = await readState();
  check('Pause du projet appliquée au checkpoint (code de sortie 2)', state.control.paused && checkpoint.status === 2);
  check('Aucune tâche ne peut démarrer en pause', orchestrate('task', 'B2', 'in_progress').status !== 0);
  check('Aucun agent ne peut être lancé en pause', orchestrate('run', 'start', '08', 'B2', 'test').status !== 0);
  await page.waitForSelector('#global-controls [data-type="project.resume"]', { timeout: 10000 });
  await page.click('#global-controls [data-type="project.resume"]');
  await page.waitForSelector('#global-controls [data-type="project.resume"][disabled]');
  orchestrate('checkpoint');
  check('Reprise du projet appliquée', !(await readState()).control.paused);

  await page.goto(`${BASE}/#/rapports`);
  check('Lien symbolique absent de la liste des rapports', (await page.locator('[data-path="fuite.md"]').count()) === 0);
  await page.click('[data-action="open-report"][data-path="agent-reports/exemple.md"]');
  await page.waitForSelector('#report-dialog .prose');
  const reportHtml = await page.locator('#report-dialog .prose').innerHTML();
  check('Rapport rendu, contenu HTML échappé', reportHtml.includes('<strong>gras</strong>') && !reportHtml.includes('<script>'));
  await page.click('#report-dialog [data-action="close-dialog"]');

  await page.goto(`${BASE}/#/journal`);
  await page.waitForSelector('#journal-agent');
  await page.selectOption('#journal-agent', '04');
  const agentsInLog = await page.locator('.log__agent').allInnerTexts();
  check("Filtre de l'historique par agent", agentsInLog.length > 0 && agentsInLog.every((text) => text === '04'));

  /* --- Responsive --- */
  await mkdir(SHOTS, { recursive: true });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width < 700 ? 800 : 900 });
    const overflowing = [];
    for (const name of VIEWS) {
      await page.goto(`${BASE}/#/${name}`);
      await page.waitForSelector('main > *');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) overflowing.push(`${name || 'tableau de bord'} (+${overflow}px)`);
    }
    check(`Aucun débordement horizontal à ${width}px`, overflowing.length === 0, overflowing.join(', '));
    if ([360, 1280].includes(width)) {
      for (const name of ['', 'agents', 'decisions']) {
        await page.goto(`${BASE}/#/${name}`);
        await page.waitForSelector('main > *');
        await page.screenshot({ path: path.join(SHOTS, `${name || 'tableau-de-bord'}-${width}.png`), fullPage: true });
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${BASE}/#/agents`);
  await page.click('[data-agent="07"]');
  await page.waitForSelector('#agent-dialog[open]');
  await page.screenshot({ path: path.join(SHOTS, 'fiche-agent-390.png') });
  const smallTargets = await page.evaluate(() => [...document.querySelectorAll('.btn')].filter((el) => el.offsetParent && el.getBoundingClientRect().height < 44).length);
  check('Boutons de 44 px de haut au minimum', smallTargets === 0, `${smallTargets} bouton(s) trop petit(s)`);

  check('Aucune erreur dans la console', consoleErrors.length === 0, consoleErrors.join(' | '));
} finally {
  await browser.close();
  server.kill();
  await rm(sandbox, { recursive: true, force: true });
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length} / ${results.length} vérifications réussies.`);
process.exit(failed.length ? 1 : 0);

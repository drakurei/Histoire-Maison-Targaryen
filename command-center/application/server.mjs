#!/usr/bin/env node
// TARGARYEN COMMAND CENTER — serveur local.
// - Écoute uniquement sur 127.0.0.1 (jamais exposé au réseau).
// - Aucune dépendance externe, aucun secret, aucun appel sortant.
// - Lecture seule sur l'état du projet ; la seule écriture possible est l'ajout d'une
//   demande dans orchestration/inbox/commands.jsonl, lue par l'orchestrateur à chaque checkpoint.

import http from 'node:http';
import { readFile, readdir, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import {
  FILES, REPORTS_DIR, PROJECT_DIR, COMMAND_TYPES, now,
  readJson, readJsonLines, appendJsonLine, readCommands,
} from '../orchestration/lib/store.mjs';

const HOST = '127.0.0.1';
const PORT = Number(process.env.TCC_PORT) || 4714;
const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const MAX_BODY_BYTES = 8 * 1024;
const MAX_NOTE_LENGTH = 1000;
const MAX_EVENTS = 400;
const MAX_PENDING_COMMANDS = 30;

const STATIC_FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
};

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};

const allowedHosts = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const allowedOrigins = new Set([`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': type });
  res.end(payload);
}

async function listReports() {
  const reports = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const info = await stat(full);
        reports.push({ path: path.relative(REPORTS_DIR, full).split(path.sep).join('/'), size: info.size, modifiedAt: info.mtime.toISOString() });
      }
    }
  }
  await walk(REPORTS_DIR);
  return reports.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

let lastGoodState = null;

/** Assemble l'état réel à partir des fichiers d'orchestration. */
async function buildSnapshot() {
  // state.json peut être en cours de réécriture par l'orchestrateur : on garde alors le dernier état lisible.
  let state;
  let stale = false;
  try {
    state = await readJson(FILES.state);
    if (state) lastGoodState = state;
  } catch {
    state = lastGoodState;
    stale = true;
  }
  const [registry, plan, events, commands, reports] = await Promise.all([
    readJson(FILES.registry), readJson(FILES.plan), readJsonLines(FILES.events), readCommands(), listReports(),
  ]);
  return {
    generatedAt: now(),
    stale,
    projectDir: path.basename(PROJECT_DIR),
    registry,
    plan,
    state,
    events: events.rows.slice(-MAX_EVENTS).reverse(),
    eventCount: events.rows.length,
    commands: commands.slice(-100).reverse(),
    commandTypes: COMMAND_TYPES,
    reports,
  };
}

async function readReport(relative) {
  if (typeof relative !== 'string' || !relative.endsWith('.md')) throw new HttpError(400, 'Rapport invalide.');
  const resolved = path.resolve(REPORTS_DIR, relative);
  if (!resolved.startsWith(REPORTS_DIR + path.sep)) throw new HttpError(403, 'Chemin refusé.');
  try {
    // Un lien symbolique ne doit pas permettre de sortir du dossier des rapports.
    const [real, root] = await Promise.all([realpath(resolved), realpath(REPORTS_DIR)]);
    if (!real.startsWith(root + path.sep)) throw new HttpError(403, 'Chemin refusé.');
    return await readFile(real, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') throw new HttpError(404, 'Rapport introuvable.');
    throw error;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        // On cesse de lire mais on laisse la connexion ouverte pour répondre 413.
        if (!req.tooLarge) { req.tooLarge = true; reject(new HttpError(413, 'Requête trop volumineuse.')); }
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function validateCommand(body) {
  let input;
  try {
    input = JSON.parse(body);
  } catch {
    throw new HttpError(400, 'JSON invalide.');
  }
  if (!input || typeof input !== 'object' || typeof input.type !== 'string') throw new HttpError(400, 'Type de commande inconnu.');
  if (input.target != null && typeof input.target !== 'string') throw new HttpError(400, 'Cible invalide.');
  const spec = Object.hasOwn(COMMAND_TYPES, input.type) ? COMMAND_TYPES[input.type] : null;
  if (!spec) throw new HttpError(400, 'Type de commande inconnu.');
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, MAX_NOTE_LENGTH) : '';
  let target = null;
  if (spec.target === 'agent') {
    const registry = await readJson(FILES.registry);
    if (!registry?.agents.some((agent) => agent.id === input.target)) throw new HttpError(400, 'Agent inconnu.');
    target = input.target;
  } else if (spec.target === 'decision') {
    const state = await readJson(FILES.state);
    if (!state?.decisions.some((decision) => decision.id === input.target)) throw new HttpError(400, 'Décision inconnue.');
    target = input.target;
  }
  if (['agent.reevaluate', 'agent.improve', 'decision.improve', 'decision.reject'].includes(input.type) && !note) {
    throw new HttpError(400, 'Un motif est nécessaire pour cette demande.');
  }
  return { id: randomUUID(), ts: now(), type: input.type, target, note };
}

async function route(req, res) {
  if (!allowedHosts.has(req.headers.host)) throw new HttpError(403, 'Hôte refusé.');
  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  if (req.method === 'GET' && Object.hasOwn(STATIC_FILES, url.pathname)) {
    const [file, type] = STATIC_FILES[url.pathname];
    return send(res, 200, await readFile(path.join(PUBLIC_DIR, file)), type);
  }
  if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, await buildSnapshot());
  if (req.method === 'GET' && url.pathname === '/api/report') {
    return send(res, 200, { path: url.searchParams.get('path'), content: await readReport(url.searchParams.get('path')) });
  }
  if (req.method === 'POST' && url.pathname === '/api/command') {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.has(origin)) throw new HttpError(403, 'Origine refusée.');
    const contentType = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/json') throw new HttpError(415, 'Type de contenu refusé.');
    const command = await validateCommand(await readBody(req));
    const pending = (await readCommands()).filter((item) => !item.ack).length;
    if (pending >= MAX_PENDING_COMMANDS) throw new HttpError(429, `Trop de demandes en attente (${pending}) : attendez le prochain checkpoint de l'orchestrateur.`);
    await appendJsonLine(FILES.commands, command);
    return send(res, 201, { accepted: true, command });
  }
  throw new HttpError(404, 'Ressource inconnue.');
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error(error);
    send(res, status, { error: status === 500 ? 'Erreur interne du Command Center.' : error.message });
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. Le Command Center est peut-être déjà ouvert : http://${HOST}:${PORT}`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`TARGARYEN COMMAND CENTER — http://${HOST}:${PORT}`);
  console.log('Accessible uniquement depuis cet ordinateur. Fermer cette fenêtre pour arrêter.');
});

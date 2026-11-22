// Audit des liens internes : part d'une adresse, suit chaque lien du site et signale ceux
// qui mènent à la page introuvable, à une erreur, ou à une ancre qui n'existe pas.
//
// Usage : node tests/functional/links.mjs <url-de-départ> [options]
//   node tests/functional/links.mjs http://127.0.0.1:4173/version-1
//   npm run audit:links -- http://127.0.0.1:4173 --max=300
//
// Options :
//   --scope=/version-1  ne suit que les liens des pages sous ce préfixe (défaut : le chemin
//                       de l'adresse de départ). Un lien qui sort de la portée est vérifié,
//                       mais ses propres liens ne sont pas suivis.
//   --max=1500          nombre maximal d'adresses visitées
//   --locale=en-US      langue annoncée par le navigateur (défaut : fr-FR)
//
// Ce que le script reconnaît (contrat de src/app/a11y.ts) : toute vue rend un
// <main id="contenu"> ; la page introuvable porte data-ecran="introuvable", l'écran de la
// garde d'erreur data-ecran="erreur", une version qui n'est pas ouverte
// data-ecran="construction". Une réponse HTTP d'erreur, une exception ou une erreur de
// console comptent comme des erreurs. Une version en construction est notée à part.
//
// Codes de sortie : 0 tout est sain ; 1 lien mort, erreur ou ancre absente ;
// 2 commande mal formée ; 3 audit incomplet (limite --max atteinte, rien de fautif jusque-là).
//
// Machine à mémoire limitée : une seule page ouverte à la fois, renouvelée de loin en loin,
// navigateur refermé à la fin quoi qu'il arrive.
import { chromium } from 'playwright-core';

/** Même identifiant que MAIN_ID dans src/app/a11y.ts. */
const MAIN_ID = 'contenu';
/** Même clé que src/shared/seuil/SeuilGate.tsx : l'ouverture ne se rejoue pas pendant l'audit. */
const SEUIL_SESSION_KEY = 'tlv.seuil';
const DEFAULT_MAX = 1500;
const DEFAULT_LOCALE = 'fr-FR';
const NAVIGATION_TIMEOUT_MS = 30_000;
const RENDER_TIMEOUT_MS = 10_000;
/** La vue est tenue pour stable quand deux relevés de suite comptent autant de liens et d'ancres. */
const SETTLE_STEP_MS = 100;
const SETTLE_MAX_ROUNDS = 30;
/** Une page neuve toutes les N visites : la mémoire du navigateur ne s'accumule pas. */
const VISITS_PER_PAGE = 50;
const PROGRESS_EVERY = 25;
const MAX_REFERRERS_SHOWN = 5;
const KNOWN_FLAGS = new Set(['scope', 'max', 'locale']);

const USAGE = 'Usage : node tests/functional/links.mjs <url-de-départ> [--scope=/version-1] [--max=1500] [--locale=fr-FR]';

function fail(message) {
  console.error(message);
  console.error(USAGE);
  process.exit(2);
}

/** « 1 adresse », « 12 adresses ». */
function count(n, singular, plural) {
  return `${n} ${n > 1 ? plural : singular}`;
}

function firstLine(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.split('\n')[0];
}

function parseArgs(argv) {
  const flags = new Map();
  const positionals = [];
  for (const argument of argv) {
    if (!argument.startsWith('--')) {
      positionals.push(argument);
      continue;
    }
    const separator = argument.indexOf('=');
    const name = separator === -1 ? argument.slice(2) : argument.slice(2, separator);
    if (!KNOWN_FLAGS.has(name)) fail(`Option inconnue : « ${argument} ».`);
    flags.set(name, separator === -1 ? '' : argument.slice(separator + 1));
  }

  if (positionals.length !== 1) fail('Il faut une adresse de départ, et une seule.');
  let start;
  try {
    start = new URL(positionals[0]);
  } catch {
    fail(`Adresse de départ illisible : « ${positionals[0]} ».`);
  }
  if (start.protocol !== 'http:' && start.protocol !== 'https:') {
    fail(`L'adresse de départ doit commencer par http:// ou https:// : « ${positionals[0]} ».`);
  }

  const max = flags.has('max') ? Number(flags.get('max')) : DEFAULT_MAX;
  if (!Number.isInteger(max) || max < 1) fail(`Limite illisible : « ${flags.get('max')} ». Attendu : un entier positif.`);

  const scopeArgument = flags.has('scope') ? flags.get('scope') : start.pathname;
  // Git Bash réécrit un argument qui commence par « / » en chemin Windows (C:/Program Files/Git/…).
  if (/^[A-Za-z]:[\\/]/.test(scopeArgument)) {
    fail(
      `« ${scopeArgument} » n'est pas un chemin du site : le shell a réécrit la barre initiale. ` +
        'Écrire --scope=version-1 ou lancer la commande avec MSYS_NO_PATHCONV=1.',
    );
  }
  const scope = `/${scopeArgument}`.replace(/\/+/g, '/').replace(/\/$/, '');

  return { start, scope, max, locale: flags.get('locale') || DEFAULT_LOCALE };
}

/** Adresse sans ancre, paramètres triés, sans barre finale : deux liens vers la même vue se confondent. */
function pageKey(address) {
  const url = new URL(address);
  url.hash = '';
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.href;
}

/** Ce que le rapport affiche d'une adresse : son chemin et ses paramètres. */
function show(key) {
  const url = new URL(key);
  return `${url.pathname}${url.search}`;
}

function decodeAnchor(hash) {
  const raw = hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Exécutée dans la page : l'écran affiché, les liens et les identifiants présents. */
function readPage() {
  const links = [];
  for (const anchor of document.querySelectorAll('a[href]')) {
    try {
      // getAttribute plutôt que la propriété href : un <a> de SVG n'y range pas une chaîne.
      links.push(new URL(anchor.getAttribute('href'), document.baseURI).href);
    } catch {
      // Adresse illisible : ce n'est pas un lien interne.
    }
  }
  return {
    screen: document.querySelector('[data-ecran]')?.getAttribute('data-ecran') ?? null,
    links,
    ids: [...document.querySelectorAll('[id]')].map((element) => element.id),
  };
}

/** Attend que la vue cesse de grandir (blocs et données chargés à la demande). */
async function settle(page) {
  let previous = -1;
  let stable = 0;
  for (let round = 0; round < SETTLE_MAX_ROUNDS && stable < 2; round += 1) {
    await page.waitForTimeout(SETTLE_STEP_MS);
    const size = await page.evaluate(() => document.querySelectorAll('a[href], [id]').length);
    stable = size === previous ? stable + 1 : 0;
    previous = size;
  }
}

function classify(screen, errors) {
  if (screen === 'introuvable') return 'introuvable';
  if (screen === 'erreur' || errors.length > 0) return 'erreur';
  if (screen === 'construction') return 'construction';
  return 'ok';
}

/**
 * Charge une adresse et dit ce qu'on y trouve.
 * `kind` : 'ok', 'introuvable', 'erreur', 'construction' ou 'ressource' (fichier servi tel quel).
 */
async function visit(page, key) {
  const errors = [];
  const onPageError = (error) => errors.push(`exception : ${error.message}`);
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(`console : ${message.text()}`);
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);

  try {
    const response = await page.goto(key, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS });
    const status = response?.status() ?? 0;
    if (status >= 400) return { kind: 'erreur', detail: [`réponse HTTP ${status}`], finalKey: key };

    const contentType = response?.headers()['content-type'] ?? '';
    if (!contentType.includes('text/html')) return { kind: 'ressource', detail: [], finalKey: key };

    const rendered = await page
      .waitForSelector(`#${MAIN_ID}`, { state: 'attached', timeout: RENDER_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
    if (!rendered) {
      const missing = `aucun <main id="${MAIN_ID}"> après ${RENDER_TIMEOUT_MS / 1000} s`;
      return { kind: 'erreur', detail: [missing, ...errors], finalKey: pageKey(page.url()) };
    }

    await settle(page);
    const { screen, links, ids } = await page.evaluate(readPage);
    return {
      kind: classify(screen, errors),
      detail: [...errors],
      links,
      ids: new Set(ids),
      finalKey: pageKey(page.url()),
    };
  } catch (error) {
    return { kind: 'erreur', detail: [`page inaccessible : ${firstLine(error)}`, ...errors], finalKey: key };
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
  }
}

const { start, scope, max, locale } = parseArgs(process.argv.slice(2));
const origin = start.origin;

/** Adresses connues : qui y mène. */
const referrersOf = new Map();
/** Adresses visitées : ce qu'on y a trouvé. */
const results = new Map();
/** Ancres visées, par « adresse#identifiant ». */
const anchors = new Map();
const queue = [];
let external = 0;

function inScope(key) {
  const { pathname } = new URL(key);
  return scope === '' || pathname === scope || pathname.startsWith(`${scope}/`);
}

function enqueue(address, referrer) {
  const key = pageKey(address);
  if (!referrersOf.has(key)) {
    referrersOf.set(key, new Set());
    queue.push(key);
  }
  if (referrer) referrersOf.get(key).add(referrer);
  return key;
}

function noteAnchor(key, id, referrer) {
  // « #top » et l'ancre vide mènent en haut de page sans élément correspondant.
  if (id === '' || id === 'top') return;
  const name = `${key}#${id}`;
  if (!anchors.has(name)) anchors.set(name, { page: key, id, referrers: new Set() });
  anchors.get(name).referrers.add(referrer);
}

function follow(links, fromKey) {
  for (const href of links) {
    const url = new URL(href);
    if (url.origin !== origin) {
      external += 1;
      continue;
    }
    const key = enqueue(url, fromKey);
    if (url.hash) noteAnchor(key, decodeAnchor(url.hash), fromKey);
  }
}

function referrers(set) {
  if (set.size === 0) return 'adresse de départ';
  const list = [...set].map(show);
  const shown = list.slice(0, MAX_REFERRERS_SHOWN).join(', ');
  const rest = list.length - MAX_REFERRERS_SHOWN;
  return `lié depuis ${shown}${rest > 0 ? ` et ${rest} de plus` : ''}`;
}

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
} catch (error) {
  console.error(`Chrome n'a pas pu être lancé : ${firstLine(error)}`);
  process.exit(1);
}

let visited = 0;
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, locale });
  await context.addInitScript((key) => {
    try {
      window.sessionStorage.setItem(key, '1');
    } catch {
      // Stockage refusé : l'ouverture se jouera, les liens restent lisibles.
    }
  }, SEUIL_SESSION_KEY);

  let page = await context.newPage();
  enqueue(start, null);

  while (queue.length > 0 && visited < max) {
    const key = queue.shift();
    if (results.has(key)) continue;

    if (visited > 0 && visited % VISITS_PER_PAGE === 0) {
      await page.close();
      page = await context.newPage();
    }

    const result = await visit(page, key);
    visited += 1;
    results.set(key, result);
    // Une redirection (la racine vers la version par défaut) : l'arrivée est tenue pour visitée,
    // et ceux qui menaient au départ mènent à l'arrivée.
    if (result.finalKey !== key) {
      if (!results.has(result.finalKey)) results.set(result.finalKey, result);
      if (!referrersOf.has(result.finalKey)) referrersOf.set(result.finalKey, new Set());
      for (const referrer of referrersOf.get(key)) referrersOf.get(result.finalKey).add(referrer);
    }

    const expandable = result.kind === 'ok' || result.kind === 'construction';
    if (expandable && result.links && inScope(result.finalKey)) follow(result.links, result.finalKey);

    if (visited % PROGRESS_EVERY === 0) console.log(`… ${visited} adresses visitées, ${queue.length} en attente`);
  }
} finally {
  await browser.close();
}

const pending = queue.filter((key) => !results.has(key));
// Une adresse qui redirige est rapportée sous son adresse d'arrivée, une seule fois.
const reported = [...results.keys()].filter((key) => results.get(key).finalKey === key);
const byKind = (kind) => reported.filter((key) => results.get(key).kind === kind);

const notFound = byKind('introuvable');
const failed = byKind('erreur');
const underConstruction = byKind('construction');
const missingAnchors = [...anchors.values()].filter((anchor) => {
  const result = results.get(anchor.page);
  return result?.kind === 'ok' && result.ids !== undefined && !result.ids.has(anchor.id);
});

console.log('');
console.log(`Liens internes depuis ${show(pageKey(start))} (portée : ${scope || 'tout le site'})`);
console.log(
  `${count(visited, 'adresse visitée', 'adresses visitées')}, ${count(external, 'lien externe ignoré', 'liens externes ignorés')}.`,
);

if (notFound.length > 0) {
  console.log('');
  console.log(`Pages introuvables : ${notFound.length}`);
  for (const key of notFound) {
    console.log(`  ${show(key)}`);
    console.log(`    ${referrers(referrersOf.get(key) ?? new Set())}`);
  }
}

if (failed.length > 0) {
  console.log('');
  console.log(`Erreurs : ${failed.length}`);
  for (const key of failed) {
    console.log(`  ${show(key)}`);
    for (const line of results.get(key).detail) console.log(`    ${line}`);
    console.log(`    ${referrers(referrersOf.get(key) ?? new Set())}`);
  }
}

if (missingAnchors.length > 0) {
  console.log('');
  console.log(`Ancres absentes : ${missingAnchors.length}`);
  for (const anchor of missingAnchors) {
    console.log(`  ${show(anchor.page)}#${anchor.id}`);
    console.log(`    ${referrers(anchor.referrers)}`);
  }
}

if (underConstruction.length > 0) {
  console.log('');
  console.log(`Versions en construction (notées, non fautives) : ${underConstruction.map(show).join(', ')}`);
}

const broken = notFound.length + failed.length + missingAnchors.length;
console.log('');
if (pending.length > 0) {
  const left = count(pending.length, 'adresse non visitée', 'adresses non visitées');
  console.log(`Audit incomplet : limite de ${max} atteinte, ${left} (voir --max).`);
}
console.log(broken === 0 ? 'Aucun lien mort parmi les adresses visitées.' : `${count(broken, 'signalement', 'signalements')}.`);

process.exitCode = broken > 0 ? 1 : pending.length > 0 ? 3 : 0;

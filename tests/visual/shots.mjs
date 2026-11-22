// Captures de contrôle : chaque chemin du site, à six largeurs, avec le Chrome installé.
//
// Usage : node tests/visual/shots.mjs <url-de-base> [chemin ...] [options]
//   node tests/visual/shots.mjs http://127.0.0.1:4173 /version-1 /version-1/dragons /comparer
//   npm run shots -- http://127.0.0.1:4173 "/version-1/lignee?p=aegon-i" --widths=360,1440
//
// Sans chemin, seule la racine est capturée. L'URL de base peut porter un préfixe :
// avec http://127.0.0.1:4173/version-1, le chemin /dragons vise /version-1/dragons.
//
// Options :
//   --widths=360,1440   largeurs à capturer (défaut : 360, 390, 768, 1280, 1440, 1920)
//   --full              la page entière plutôt que le premier écran
//   --wait=600          délai après le chargement et les polices, en millisecondes
//   --reduced-motion    émule « prefers-reduced-motion: reduce »
//   --locale=en-US      langue annoncée par le navigateur (défaut : fr-FR)
//
// Sortie : tests/visual/out/<nom>-<largeur>.png, où <nom> reprend le chemin
// (« /version-1/dragons » donne « version-1-dragons », la racine donne « racine »).
//
// Pour chaque capture, le script signale un débordement horizontal
// (document.documentElement.scrollWidth > innerWidth), avec les éléments qui dépassent,
// ainsi que les erreurs de console et les exceptions. Code de sortie : 0 si tout est sain,
// 1 au moindre signalement, 2 si la commande est mal formée.
//
// L'ouverture du site (le seuil) est tenue pour déjà vue ; ajouter « ?seuil » au chemin
// pour la capturer. Machine à mémoire limitée : une seule page ouverte à la fois,
// navigateur refermé à la fin quoi qu'il arrive.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

const DEFAULT_WIDTHS = [360, 390, 768, 1280, 1440, 1920];
/** Hauteur de fenêtre plausible pour chaque largeur : téléphones, tablette, écrans. */
const HEIGHTS = new Map([
  [360, 800],
  [390, 844],
  [768, 1024],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
]);
const DEFAULT_HEIGHT = 900;
const DEFAULT_WAIT_MS = 600;
const DEFAULT_LOCALE = 'fr-FR';
const NAVIGATION_TIMEOUT_MS = 30_000;
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out');
/** Même clé que src/shared/seuil/SeuilGate.tsx : l'ouverture ne se rejoue pas à chaque capture. */
const SEUIL_SESSION_KEY = 'tlv.seuil';
const KNOWN_FLAGS = new Set(['widths', 'full', 'wait', 'reduced-motion', 'locale']);

const USAGE =
  'Usage : node tests/visual/shots.mjs <url-de-base> [chemin ...] [--widths=360,1440] [--full] [--wait=600] [--reduced-motion] [--locale=fr-FR]';

function fail(message) {
  console.error(message);
  console.error(USAGE);
  process.exit(2);
}

function firstLine(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.split('\n')[0];
}

/** Chemin du site tel que donné sur la ligne de commande, ramené à la forme « /a/b ». */
function toRoute(argument) {
  // Git Bash réécrit un argument qui commence par « / » en chemin Windows (C:/Program Files/Git/…).
  if (/^[A-Za-z]:[\\/]/.test(argument)) {
    fail(
      `« ${argument} » n'est pas un chemin du site : le shell a réécrit la barre initiale. ` +
        'Écrire le chemin sans elle (version-1/dragons) ou lancer la commande avec MSYS_NO_PATHCONV=1.',
    );
  }
  return argument.startsWith('/') ? argument : `/${argument}`;
}

/** « /version-1/dragons?lang=fr » -> « version-1-dragons-lang-fr » ; la racine -> « racine ». */
function shotName(route) {
  return route.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'racine';
}

/** Associe à chaque chemin son adresse et un nom de fichier unique. */
function planShots(prefix, routes) {
  const used = new Map();
  return [...new Set(routes)].map((route) => {
    const base = shotName(route);
    const occurrence = (used.get(base) ?? 0) + 1;
    used.set(base, occurrence);
    return { route, url: `${prefix}${route}`, name: occurrence === 1 ? base : `${base}-${occurrence}` };
  });
}

function parseWidths(value) {
  const widths = value.split(',').map((part) => Number(part.trim()));
  if (widths.length === 0 || widths.some((width) => !Number.isInteger(width) || width < 240 || width > 4000)) {
    fail(`Largeurs illisibles : « ${value} ». Attendu : des entiers séparés par des virgules, de 240 à 4000.`);
  }
  return widths;
}

function parseWait(value) {
  const wait = Number(value);
  if (value === '' || !Number.isFinite(wait) || wait < 0) {
    fail(`Délai illisible : « ${value} ». Attendu : un nombre de millisecondes.`);
  }
  return wait;
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

  const [baseArgument, ...routeArguments] = positionals;
  if (!baseArgument) fail("Il manque l'URL de base.");

  let base;
  try {
    base = new URL(baseArgument);
  } catch {
    fail(`URL de base illisible : « ${baseArgument} ».`);
  }
  if (base.protocol !== 'http:' && base.protocol !== 'https:') {
    fail(`L'URL de base doit commencer par http:// ou https:// : « ${baseArgument} ».`);
  }

  const prefix = `${base.origin}${base.pathname.replace(/\/+$/, '')}`;
  const routes = routeArguments.length > 0 ? routeArguments.map(toRoute) : ['/'];

  return {
    shots: planShots(prefix, routes),
    widths: flags.has('widths') ? parseWidths(flags.get('widths')) : DEFAULT_WIDTHS,
    wait: flags.has('wait') ? parseWait(flags.get('wait')) : DEFAULT_WAIT_MS,
    full: flags.has('full'),
    reducedMotion: flags.has('reduced-motion'),
    locale: flags.get('locale') || DEFAULT_LOCALE,
  };
}

/**
 * Exécutée dans la page. `null` si rien ne dépasse ; sinon la mesure et les éléments les
 * plus profonds dont le bord droit sort de la fenêtre (ceux qu'il faut aller corriger).
 */
function measureOverflow() {
  const viewport = window.innerWidth;
  const scrollWidth = document.documentElement.scrollWidth;
  if (scrollWidth <= viewport) return null;

  const describe = (element) => {
    const id = element.id ? `#${element.id}` : '';
    const classes = [...element.classList]
      .slice(0, 2)
      .map((name) => `.${name}`)
      .join('');
    return `${element.tagName.toLowerCase()}${id}${classes}`;
  };

  const beyond = [...document.body.querySelectorAll('*')].filter((element) => {
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.right > viewport + 0.5;
  });
  const beyondSet = new Set(beyond);
  const deepest = beyond.filter((element) => ![...element.children].some((child) => beyondSet.has(child)));

  return {
    viewport,
    scrollWidth,
    culprits: deepest
      .slice(0, 5)
      .map((element) => `${describe(element)} (bord droit à ${Math.round(element.getBoundingClientRect().right)} px)`),
  };
}

/** Ouvre une page, la capture, la referme. Rend le fichier écrit et ce qu'il y a à signaler. */
async function capture(browser, shot, width, options) {
  const file = path.join(OUT_DIR, `${shot.name}-${width}.png`);
  const problems = [];
  const context = await browser.newContext({
    viewport: { width, height: HEIGHTS.get(width) ?? DEFAULT_HEIGHT },
    deviceScaleFactor: 1,
    locale: options.locale,
    reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
  });

  try {
    await context.addInitScript((key) => {
      try {
        window.sessionStorage.setItem(key, '1');
      } catch {
        // Stockage refusé : l'ouverture se jouera, la capture reste valable.
      }
    }, SEUIL_SESSION_KEY);

    const page = await context.newPage();
    page.on('pageerror', (error) => problems.push(`exception : ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console : ${message.text()}`);
    });

    const response = await page.goto(shot.url, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS });
    if (response && response.status() >= 400) problems.push(`réponse HTTP ${response.status()}`);
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.waitForTimeout(options.wait);

    const overflow = await page.evaluate(measureOverflow);
    if (overflow) {
      problems.push(`débordement horizontal : contenu de ${overflow.scrollWidth} px pour ${overflow.viewport} px`);
      for (const culprit of overflow.culprits) problems.push(`  dépasse : ${culprit}`);
    }

    await page.screenshot({ path: file, fullPage: options.full });
  } catch (error) {
    problems.push(`capture impossible : ${firstLine(error)}`);
  } finally {
    await context.close();
  }

  return { file, problems };
}

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(OUT_DIR, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
} catch (error) {
  console.error(`Chrome n'a pas pu être lancé : ${firstLine(error)}`);
  process.exit(1);
}

let total = 0;
let flagged = 0;
try {
  for (const shot of options.shots) {
    for (const width of options.widths) {
      const { file, problems } = await capture(browser, shot, width, options);
      const label = path.relative(process.cwd(), file);
      total += 1;
      if (problems.length === 0) {
        console.log(`ok  ${label}`);
        continue;
      }
      flagged += 1;
      console.log(`!!  ${label}  (${shot.route}, ${width} px)`);
      for (const problem of problems) console.log(`      ${problem}`);
    }
  }
} finally {
  await browser.close();
}

const count = `${total} ${total > 1 ? 'captures' : 'capture'}`;
const verdict = flagged === 0 ? 'aucun débordement, aucune erreur' : `${flagged} avec un signalement`;
console.log('');
console.log(`${count} : ${verdict}. Dossier : ${path.relative(process.cwd(), OUT_DIR)}`);
process.exitCode = flagged === 0 ? 0 : 1;

// Tests de la maquette interactive dans Chromium (Playwright), ouverte comme le fera l'utilisateur : en file://.
// Usage : node tests/functional/maquette.test.mjs

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const URL_BASE = pathToFileURL(path.join(ROOT, 'design', 'prototypes', 'maquette.html')).href;
const SHOTS = path.join(ROOT, 'tests', 'visual', 'maquette');
const WIDTHS = [360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const ROUTES = ['', 'periode/p1', 'periode/p5', 'periode/p8', 'personnes', 'personne/rhaenyra', 'personne/aegon-i', 'lignee/aegon-i', 'lignee/aegon-iv', 'lignee/maegor-i', 'dragons', 'dragon/balerion', 'dragon/vhagar', 'langue', 'sources', 'systeme', 'directions', 'apropos', 'avenir/guerres', 'inconnu'];

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: Boolean(ok) }); console.log(`${ok ? 'OK   ' : 'ÉCHEC'} ${name}${detail ? ` — ${detail}` : ''}`); };

await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const newPage = async (options = {}) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR', ...options });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  return page;
};
const open = async (page, route) => { await page.goto(`${URL_BASE}#/${route}`); await page.evaluate(() => document.fonts.ready); await page.waitForSelector(`#page[data-route="${route}"] > *`); await page.waitForTimeout(40); };

try {
  /* --- Seuil --- */
  let page = await newPage();
  await page.goto(URL_BASE);
  check('Seuil affiché à la première visite, page inerte', await page.evaluate(() => !document.getElementById('seuil').hidden && document.getElementById('page').inert));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SHOTS, 'seuil-1-flammes.png') });
  check('Salutation tirée du lexique', (await page.locator('#seuil-salut').innerText()).toLowerCase() === 'valar morghūlis');
  await page.waitForSelector('#seuil.is-pret', { timeout: 8000 });
  check('14 flammes allumées avant la réponse', (await page.locator('#seuil .flamme.allumee').count()) === 14);
  check('Jauge accessible à 14', (await page.locator('#seuil-jauge').getAttribute('aria-valuenow')) === '14');
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(SHOTS, 'seuil-2-pret.png') });
  await page.locator('#seuil-reponse').click();
  await page.waitForFunction(() => document.getElementById('seuil').hidden, null, { timeout: 4000 });
  check('Entrée : seuil retiré, page active', await page.evaluate(() => !document.getElementById('page').inert));
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SHOTS, 'portail-1440-hv.png'), fullPage: true });

  // Entrée automatique sans geste
  page = await newPage();
  await page.goto(URL_BASE);
  await page.waitForFunction(() => document.getElementById('seuil').hidden, null, { timeout: 12000 });
  check('Entrée automatique après la réponse rituelle', true);

  // Impatience : un geste saute à l'état prêt
  page = await newPage();
  await page.goto(URL_BASE);
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  check('Un geste pendant la séquence saute à l\'état prêt', await page.evaluate(() => document.getElementById('seuil').classList.contains('is-pret')));

  // Mouvement réduit
  page = await newPage({ reducedMotion: 'reduce' });
  await page.goto(URL_BASE);
  await page.waitForTimeout(150);
  check('Mouvement réduit : sceau complet d\'emblée', await page.evaluate(() => document.getElementById('seuil').classList.contains('is-pret') && document.querySelectorAll('#seuil .flamme.allumee').length === 14));

  // Lien profond : pas de seuil
  page = await newPage();
  await open(page, 'periode/p5');
  check('Lien profond : pas de seuil', await page.evaluate(() => document.getElementById('seuil').hidden));

  /* --- Langues --- */
  check('Mode valyrien par défaut, glose en français', (await page.locator('.tete h1 .hv').innerText()) === 'Zaldrīzoti Lilion' && (await page.locator('.tete h1 .glose').innerText()).includes('Danse des Dragons'));
  check('html lang = langue de lecture', (await page.evaluate(() => document.documentElement.lang)) === 'fr');
  check('Mention d\'édition présente en mode valyrien', (await page.locator('.mention').count()) === 1);
  const allLexResolved = await page.evaluate(() => { const ids = new Set(JSON.parse(document.getElementById('donnees').textContent).lexicon.map((entry) => entry.id)); return [...document.querySelectorAll('[lang="art-x-valyrian"][data-lex]')].every((node) => ids.has(node.dataset.lex)); });
  check('Toute chaîne valyrienne référence le lexique', allLexResolved);
  await page.locator('#barre [data-langue="en"]').click();
  check('Bascule en anglais sans rechargement', (await page.locator('.tete h1').innerText()).startsWith('The Dance of the Dragons') && (await page.evaluate(() => document.documentElement.lang)) === 'en');
  check('Anglais : plus de mention d\'édition', (await page.locator('.mention').count()) === 0);
  await page.locator('#barre [data-langue="fr"]').click();
  check('Bascule en français', (await page.locator('.tete h1').innerText()).startsWith('La Danse des Dragons'));
  const frenchLeft = await page.evaluate(() => [...document.querySelectorAll('#barre .hv, #page .annale .hv')].length);
  check('Français : aucune rubrique valyrienne résiduelle dans la barre', frenchLeft === 0);
  await page.locator('#barre [data-langue="hv"]').click();
  await page.locator('#bascule-glose').click();
  check('Glose masquable (reste accessible)', await page.evaluate(() => { const gloss = document.querySelector('.tete h1 .glose'); return gloss.hasAttribute('data-masquee') && gloss.getBoundingClientRect().width <= 1; }));
  await page.locator('#bascule-glose').click();

  /* --- Interactions --- */
  check('Annales : adaptations masquées par défaut', (await page.locator('.annale[data-continuite="adaptation"]').count()) === 0);
  const before = await page.locator('.annale').count();
  await page.locator('[data-adaptation]').click();
  check('Filtre adaptations', (await page.locator('.annale').count()) > before && (await page.locator('.annale[data-continuite="adaptation"]').count()) > 0);
  await page.locator('[data-adaptation]').click();
  await page.locator('[data-fiabilite="contradictoire"]').click();
  check('Filtre de fiabilité', (await page.locator('.annale').count()) > 0 && (await page.locator('.annale').count()) < before);
  await page.locator('[data-fiabilite=""]').click();
  await page.locator('.annale summary').first().click();
  check('Annale dépliable avec sources', (await page.locator('.annale details[open] dl').innerText()).length > 10);

  await page.locator('.tete h1 .hv').click();
  check('Note de glose au clic sur un mot valyrien', (await page.locator('#note-glose').count()) === 1);
  await page.keyboard.press('Escape');

  await page.locator('#ouvrir-recherche').click();
  await page.fill('#champ-recherche', 'aegon');
  const hits = await page.locator('#resultats-recherche a').allInnerTexts();
  check('Recherche « aegon » tolérante aux macrons (trouve Āegon)', hits.length > 5 && hits.some((text) => text.includes('Āegon')), `${hits.length} résultats`);
  await page.locator('#resultats-recherche a').first().click();
  await page.waitForSelector('#recherche:not([open])', { state: 'attached' });
  check('Un résultat ferme la recherche et navigue', true);

  await open(page, 'lignee/aegon-i');
  check('Lignée : parents, sujet et unions', (await page.locator('.noeud--sujet').count()) === 1 && (await page.locator('.union').count()) >= 2);
  await page.fill('#cherche-personne', 'rhaenyra');
  await page.locator('#resultats-personne a').first().click();
  await page.waitForSelector('#page[data-route="lignee/rhaenyra"] > *');
  check('Lignée : recherche de personne et recentrage', (await page.locator('.noeud--sujet .noeud__nom').innerText()).includes('Rhaenyra'));
  check('Filiation contestée signalée par un trait interrompu', (await page.locator('.trait--conteste').count()) > 0);

  await page.locator('#ouvrir-index').click();
  check('Index : 8 volumes et 9 registres', (await page.locator('#index .table-volumes li').count()) === 8 && (await page.locator('#index .registres').first().locator('li').count()) === 9);
  await page.locator('#index [data-fermer]').click();

  /* --- Toutes les vues, toutes les largeurs --- */
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width < 700 ? 780 : 900 });
    const overflowing = [];
    for (const route of ROUTES) {
      await open(page, route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) overflowing.push(`${route || 'portail'} (+${overflow}px)`);
    }
    check(`Aucun débordement horizontal à ${width}px (${ROUTES.length} vues)`, overflowing.length === 0, overflowing.join(', '));
  }
  // Paysage mobile
  await page.setViewportSize({ width: 780, height: 360 });
  await open(page, '');
  check('Paysage mobile : portail sans débordement', (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0);

  /* --- Cibles tactiles et captures --- */
  // Tous les éléments interactifs, en largeur ET en hauteur (constat A14-010). Seuls les liens insérés dans une phrase
  // ou une liste de noms sont exemptés, comme le prévoit le critère WCAG 2.5.8 (cibles en ligne).
  await page.setViewportSize({ width: 360, height: 780 });
  for (const route of ['', 'periode/p5', 'personne/rhaenyra', 'lignee/aegon-i', 'dragons', 'dragon/balerion', 'langue', 'sources', 'apropos']) {
    await open(page, route);
    const small = await page.evaluate(() => {
      const inline = (el) => el.tagName === 'A' && el.closest('p, dd, td, .enfants, .liste, .sous') && !el.matches('.bouton, .nom');
      return [...document.querySelectorAll('a[href], button, summary, input')]
        .filter((el) => el.offsetParent && !el.closest('dialog, #seuil') && !inline(el))
        .map((el) => ({ el, box: el.getBoundingClientRect() }))
        .filter(({ box }) => box.width < 43.5 || box.height < 43.5)
        .map(({ el, box }) => `${el.id || el.className || el.tagName} ${Math.round(box.width)}×${Math.round(box.height)}`);
    });
    check(`Cibles tactiles ≥ 44 × 44 px hors liens en ligne (${route || 'portail'}, 360px)`, small.length === 0, [...new Set(small)].slice(0, 6).join(', '));
  }
  await open(page, '');
  check('Barre mobile sur une seule ligne à 360 px', await page.evaluate(() => document.getElementById('barre').getBoundingClientRect().height <= 64));
  await open(page, 'periode/p1');
  check('La glose d\'un titre de volume est la traduction du lexique (A14-003)', await page.evaluate(() => { const data = JSON.parse(document.getElementById('donnees').textContent); return document.querySelector('.tete h1 .glose').textContent === data.lexicon.find((entry) => entry.id === 'period.1').fr; }));
  check('Une seule convention d\'ère en français (A14-019)', await page.evaluate(() => ![...document.querySelectorAll('.annee')].some((node) => /\bAC\b/.test(node.textContent))));
  for (const [route, name] of [['', 'portail'], ['periode/p5', 'periode'], ['personne/rhaenyra', 'personne'], ['lignee/rhaenyra', 'lignee'], ['dragons', 'dragons'], ['dragon/balerion', 'dragon'], ['langue', 'langue']]) {
    await page.setViewportSize({ width: 360, height: 780 });
    await open(page, route);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(SHOTS, `${name}-360.png`), fullPage: false });
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, route);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(SHOTS, `${name}-1440.png`), fullPage: false });
  }
  await open(page, 'systeme');
  await page.screenshot({ path: path.join(SHOTS, 'systeme-1440.png'), fullPage: true });
  await open(page, 'directions');
  await page.screenshot({ path: path.join(SHOTS, 'directions-1440.png'), fullPage: true });

  // Seuil mobile
  page = await newPage({ viewport: { width: 360, height: 780 } });
  await page.goto(URL_BASE);
  await page.waitForSelector('#seuil.is-pret', { timeout: 8000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, 'seuil-360.png') });
  check('Seuil mobile sans débordement', (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0);

  check('Aucune erreur dans la console', errors.length === 0, [...new Set(errors)].slice(0, 5).join(' | '));
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length} / ${results.length} vérifications réussies.`);
process.exit(failed.length ? 1 : 0);

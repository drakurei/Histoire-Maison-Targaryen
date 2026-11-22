#!/usr/bin/env node
// Validation de genealogy.json (et de succession.json s'il est présent).
// Node sans dépendance. Usage : node validate-genealogy.mjs [genealogy.json] [succession.json]
// Code de sortie : 0 = aucune erreur ; 1 = au moins une erreur. Les avertissements ne font pas échouer.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const genealogyPath = resolve(process.argv[2] ?? join(here, 'genealogy.json'));
const successionPath = resolve(process.argv[3] ?? join(here, 'succession.json'));

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// Tolérances
const MAX_POSTHUMOUS_YEARS = 1; // enfant né au plus ~1 an après la mort du père
const MIN_PARENT_AGE_WARN = 12; // en dessous : avertissement, pas erreur

const SEX = ['m', 'f'];
const DATE_CERT = ['exacte', 'approximative', 'inconnue'];
const LEGIT = ['legitime', 'batard-reconnu', 'batard', 'legitime-par-decret'];
const UNION_TYPES = ['mariage', 'liaison', 'fiancailles'];
const CERT = ['etabli', 'incertain', 'conteste'];
const SOURCES = ['fab', 'twoiaf', 'asoiaf', 'dunk-egg', 'trotd'];
const MODES = ['hérédité directe', 'usurpation', 'Grand Conseil', 'décret', 'guerre'];

/* ───────── 1. JSON valide ───────── */
function load(path, label) {
  let raw;
  try { raw = readFileSync(path, 'utf8'); } catch (e) { err(`${label} : lecture impossible (${e.message})`); return null; }
  try { return JSON.parse(raw); } catch (e) { err(`${label} : JSON invalide (${e.message})`); return null; }
}
const data = load(genealogyPath, 'genealogy.json');
if (!data) finish();

const persons = Array.isArray(data.persons) ? data.persons : (err('« persons » doit être un tableau'), []);
const unions = Array.isArray(data.unions) ? data.unions : (err('« unions » doit être un tableau'), []);
const parentage = Array.isArray(data.parentage) ? data.parentage : (err('« parentage » doit être un tableau'), []);
if (data.schema !== 1) err(`schema attendu 1, trouvé ${JSON.stringify(data.schema)}`);
if (data.continuity !== 'livres') err(`continuity attendu "livres", trouvé ${JSON.stringify(data.continuity)}`);

/* ───────── 2. Identifiants uniques, champs, énumérations ───────── */
const isYear = (v) => v === null || Number.isInteger(v);
const isRange = (r) => Array.isArray(r) && r.length === 2 && r.every(isYear) && (r[0] === null || r[1] === null || r[0] <= r[1]);
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const byId = new Map();
for (const p of persons) {
  if (typeof p.id !== 'string' || !ID_RE.test(p.id)) { err(`personne : identifiant invalide ${JSON.stringify(p.id)}`); continue; }
  if (byId.has(p.id)) err(`personne : identifiant en double « ${p.id} »`);
  byId.set(p.id, p);
  for (const f of ['nameEn', 'nameFr']) if (typeof p[f] !== 'string' || !p[f].trim()) err(`${p.id} : ${f} manquant`);
  for (const f of ['epithetFr', 'epithetEn']) if (!(p[f] === null || typeof p[f] === 'string')) err(`${p.id} : ${f} doit être une chaîne ou null`);
  if (!SEX.includes(p.sex)) err(`${p.id} : sex invalide (${p.sex})`);
  if (typeof p.house !== 'string' || !p.house) err(`${p.id} : house manquant`);
  if (!isYear(p.born)) err(`${p.id} : born doit être un entier ou null`);
  if (!isYear(p.died)) err(`${p.id} : died doit être un entier ou null`);
  if (!DATE_CERT.includes(p.dateCertainty)) err(`${p.id} : dateCertainty invalide (${p.dateCertainty})`);
  if (typeof p.king !== 'boolean') err(`${p.id} : king doit être booléen`);
  if (!LEGIT.includes(p.legitimacy)) err(`${p.id} : legitimacy invalide (${p.legitimacy})`);
  if (!Number.isInteger(p.generation) || p.generation < 0) err(`${p.id} : generation doit être un entier ≥ 0`);
  if (!Array.isArray(p.sources) || !p.sources.length) err(`${p.id} : sources vide`);
  else for (const s of p.sources) if (!SOURCES.includes(s)) err(`${p.id} : source inconnue « ${s} »`);
  if (p.bornRange !== undefined && !isRange(p.bornRange)) err(`${p.id} : bornRange invalide`);
  if (p.diedRange !== undefined && !isRange(p.diedRange)) err(`${p.id} : diedRange invalide`);
  if (p.born === null && p.died === null && !p.bornRange && !p.diedRange && p.dateCertainty !== 'inconnue') err(`${p.id} : aucune année, dateCertainty devrait être « inconnue »`);
  if ((p.born !== null || p.died !== null) && p.dateCertainty === 'inconnue') err(`${p.id} : années renseignées mais dateCertainty « inconnue »`);
  if ((p.bornRange || p.diedRange) && p.dateCertainty === 'exacte') err(`${p.id} : plage d'années présente mais dateCertainty « exacte »`);
  // règne
  if (p.king) {
    if (!(Array.isArray(p.reign) && p.reign.length === 2 && p.reign.every(Number.isInteger) && p.reign[0] <= p.reign[1])) err(`${p.id} : roi sans règne valide [début, fin]`);
  } else if (p.reign !== null) err(`${p.id} : reign doit être null quand king est false`);
}

// Bornes d'une année : [min, max] possibles (±Infinity si inconnu)
function span(p, kind) {
  const v = p[kind];
  const r = p[kind === 'born' ? 'bornRange' : 'diedRange'];
  if (r) return [r[0] ?? -Infinity, r[1] ?? Infinity];
  if (v !== null && v !== undefined) return [v, v];
  return [-Infinity, Infinity];
}
const known = ([a, b]) => Number.isFinite(a) || Number.isFinite(b);

for (const p of persons) {
  const [bMin, bMax] = span(p, 'born');
  const [dMin, dMax] = span(p, 'died');
  if (p.born !== null && p.bornRange && (p.born < bMin || p.born > bMax)) err(`${p.id} : born (${p.born}) hors de bornRange`);
  if (p.died !== null && p.diedRange && (p.died < dMin || p.died > dMax)) err(`${p.id} : died (${p.died}) hors de diedRange`);
  if (dMax < bMin) err(`${p.id} : mort (${dMax}) avant la naissance (${bMin})`);
  if (Number.isFinite(bMin) && Number.isFinite(dMax) && dMax - bMin > 110) warn(`${p.id} : longévité de ${dMax - bMin} ans — à vérifier`);
  if (p.alive && p.died !== null) err(`${p.id} : marqué vivant mais died renseigné`);
  // règne compris dans la vie
  if (p.king && Array.isArray(p.reign)) {
    if (p.reign[0] < bMin) err(`${p.id} : règne commencé (${p.reign[0]}) avant la naissance (${bMin})`);
    if (p.reign[1] > dMax) err(`${p.id} : règne terminé (${p.reign[1]}) après la mort (${dMax})`);
    if (p.reign[0] > dMax) err(`${p.id} : règne commencé après la mort`);
  }
  if (p.pretender) {
    const { from, to } = p.pretender;
    if (!Number.isInteger(from) || !(to === null || Number.isInteger(to))) err(`${p.id} : pretender.from/to invalides`);
    else { if (from < bMin) err(`${p.id} : prétention avant la naissance`); if (to !== null && to > dMax) err(`${p.id} : prétention après la mort`); }
  }
}

/* ───────── 3. Unions ───────── */
const unionById = new Map();
for (const u of unions) {
  if (typeof u.id !== 'string' || !ID_RE.test(u.id)) { err(`union : identifiant invalide ${JSON.stringify(u.id)}`); continue; }
  if (unionById.has(u.id)) err(`union : identifiant en double « ${u.id} »`);
  if (byId.has(u.id)) err(`union : identifiant « ${u.id} » déjà utilisé par une personne`);
  unionById.set(u.id, u);
  if (!Array.isArray(u.partners) || u.partners.length !== 2) { err(`${u.id} : partners doit contenir deux identifiants`); continue; }
  if (u.partners[0] === u.partners[1]) err(`${u.id} : une personne ne peut s'unir à elle-même`);
  for (const pid of u.partners) if (!byId.has(pid)) err(`${u.id} : partenaire inconnu « ${pid} »`);
  if (!UNION_TYPES.includes(u.type)) err(`${u.id} : type invalide (${u.type})`);
  if (!isYear(u.year)) err(`${u.id} : year doit être un entier ou null`);
  if (!CERT.includes(u.certainty)) err(`${u.id} : certainty invalide (${u.certainty})`);
  if (!Array.isArray(u.sources) || !u.sources.length) err(`${u.id} : sources vide`);
  else for (const s of u.sources) if (!SOURCES.includes(s)) err(`${u.id} : source inconnue « ${s} »`);
  if (u.year !== null) for (const pid of u.partners) {
    const p = byId.get(pid); if (!p) continue;
    const [bMin] = span(p, 'born'); const [, dMax] = span(p, 'died');
    if (u.year < bMin) err(`${u.id} : union (${u.year}) avant la naissance de ${pid} (${bMin})`);
    if (u.year > dMax) err(`${u.id} : union (${u.year}) après la mort de ${pid} (${dMax})`);
  }
}
{ // doublons de couple
  const seen = new Map();
  for (const u of unions) { if (!Array.isArray(u.partners)) continue; const k = [...u.partners].sort().join('|'); if (seen.has(k)) err(`union en double pour le couple ${k} (${seen.get(k)} et ${u.id})`); seen.set(k, u.id); }
}

/* ───────── 4. Filiations ───────── */
const parentsOf = new Map(); // enfant -> {father, mother}
for (const r of parentage) {
  const tag = `filiation de « ${r.child} »`;
  if (!byId.has(r.child)) { err(`${tag} : enfant inconnu`); continue; }
  if (parentsOf.has(r.child)) err(`${tag} : plusieurs filiations pour le même enfant`);
  parentsOf.set(r.child, r);
  if (r.father === null && r.mother === null) err(`${tag} : ni père ni mère`);
  for (const [role, sex] of [['father', 'm'], ['mother', 'f']]) {
    const id = r[role];
    if (id === null) continue;
    if (!byId.has(id)) { err(`${tag} : ${role} inconnu « ${id} »`); continue; }
    if (id === r.child) err(`${tag} : est son propre ${role}`);
    if (byId.get(id).sex !== sex) err(`${tag} : ${role} « ${id} » de sexe incohérent`);
  }
  if (r.union !== null) {
    const u = unionById.get(r.union);
    if (!u) err(`${tag} : union inconnue « ${r.union} »`);
    else for (const id of [r.father, r.mother]) if (id !== null && !u.partners.includes(id)) err(`${tag} : « ${id} » n'est pas partenaire de ${r.union}`);
  }
  if (!CERT.includes(r.certainty)) err(`${tag} : certainty invalide (${r.certainty})`);
  if (r.certainty !== 'etabli' && !(typeof r.noteFr === 'string' && r.noteFr.trim())) err(`${tag} : filiation « ${r.certainty} » sans noteFr`);
  if (r.allegedFather !== undefined) {
    if (!byId.has(r.allegedFather)) err(`${tag} : allegedFather inconnu « ${r.allegedFather} »`);
    if (r.certainty === 'etabli') err(`${tag} : allegedFather présent mais filiation « etabli »`);
  }
  if (!Array.isArray(r.sources) || !r.sources.length) err(`${tag} : sources vide`);
  else for (const s of r.sources) if (!SOURCES.includes(s)) err(`${tag} : source inconnue « ${s} »`);

  // chronologie parent / enfant (seulement quand les années sont connues)
  const child = byId.get(r.child);
  const [cbMin, cbMax] = span(child, 'born');
  for (const role of ['father', 'mother', 'allegedFather']) {
    const par = byId.get(r[role]); if (!par) continue;
    const [pbMin, pbMax] = span(par, 'born');
    const [, pdMax] = span(par, 'died');
    if (cbMax <= pbMin && Number.isFinite(cbMax) && Number.isFinite(pbMin)) err(`${tag} : né (${cbMax}) avant ou la même année que ${role} ${par.id} (${pbMin})`);
    else if (Number.isFinite(cbMax) && Number.isFinite(pbMin) && cbMax - pbMin < MIN_PARENT_AGE_WARN) warn(`${tag} : ${role} ${par.id} aurait au plus ${cbMax - pbMin} ans à la naissance`);
    if (Number.isFinite(cbMin) && Number.isFinite(pdMax)) {
      if (role === 'mother' && cbMin > pdMax) err(`${tag} : né (${cbMin}) après la mort de sa mère ${par.id} (${pdMax})`);
      if (role !== 'mother' && cbMin > pdMax + MAX_POSTHUMOUS_YEARS) err(`${tag} : né (${cbMin}) plus de ${MAX_POSTHUMOUS_YEARS} an après la mort de ${role} ${par.id} (${pdMax})`);
    }
  }
}

/* ───────── 5. Aucun cycle ───────── */
{
  const state = new Map(); // 1 = en cours, 2 = terminé
  const visit = (id, path) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { err(`cycle d'ascendance : ${[...path.slice(path.indexOf(id)), id].join(' → ')}`); return; }
    state.set(id, 1);
    const r = parentsOf.get(id);
    if (r) for (const par of [r.father, r.mother]) if (par && byId.has(par)) visit(par, [...path, id]);
    state.set(id, 2);
  };
  for (const p of persons) visit(p.id, []);
}

/* ───────── 6. Générations cohérentes ───────── */
for (const p of persons) {
  const r = parentsOf.get(p.id);
  if (!r) continue;
  const gs = [r.father, r.mother].map((id) => byId.get(id)?.generation).filter(Number.isInteger);
  if (gs.length && p.generation !== Math.max(...gs) + 1) err(`${p.id} : generation ${p.generation}, attendu ${Math.max(...gs) + 1} (1 + max des parents)`);
}
const roots = persons.filter((p) => p.generation === 0).map((p) => p.id);
if (roots.length !== 1) err(`exactement une personne de génération 0 attendue, trouvé : ${roots.join(', ') || 'aucune'}`);

// personnes isolées (ni union ni filiation)
{
  const linked = new Set();
  for (const u of unions) (u.partners ?? []).forEach((x) => linked.add(x));
  for (const r of parentage) [r.child, r.father, r.mother].forEach((x) => x && linked.add(x));
  for (const p of persons) if (!linked.has(p.id)) err(`${p.id} : personne isolée (ni union ni filiation)`);
}

/* ───────── 6 bis. Fil principal (optionnel) ───────── */
if (data.mainThread !== undefined) {
  const ids = data.mainThread?.ids;
  if (!Array.isArray(ids) || ids.length < 2) err('mainThread.ids doit être une liste d\'au moins deux identifiants');
  else ids.forEach((id, i) => {
    const p = byId.get(id);
    if (!p) { err(`mainThread : identifiant inconnu « ${id} »`); return; }
    if (p.generation !== i) err(`mainThread : ${id} est de génération ${p.generation}, attendu ${i}`);
    if (i > 0) { const r = parentsOf.get(id); if (!r || (r.father !== ids[i - 1] && r.mother !== ids[i - 1])) err(`mainThread : ${id} n'est pas l'enfant de ${ids[i - 1]}`); }
  });
}

/* ───────── 7. Parenté des conjoints (pour l'analyse) ───────── */
const par = (id) => { const r = parentsOf.get(id); return r ? [r.father, r.mother].filter(Boolean) : []; };
function sibling(a, b) { // 'plein' | 'demi' | null
  if (a === b) return null;
  const ra = parentsOf.get(a), rb = parentsOf.get(b);
  if (!ra || !rb) return null;
  const f = ra.father && ra.father === rb.father, m = ra.mother && ra.mother === rb.mother;
  if (f && m) return 'plein';
  if (!f && !m) return null;
  // Un seul parent commun : « demi » seulement si l'autre parent est connu et différent des deux côtés.
  // Si l'autre parent est inconnu (mère non nommée, par ex. Gaemon et Daenys), les sources disent
  // « frère et sœur » sans plus : on ne peut pas affirmer une demi-fratrie.
  const otherA = f ? ra.mother : ra.father, otherB = f ? rb.mother : rb.father;
  return otherA && otherB ? 'demi' : 'plein';
}
function kinship(a, b) {
  const s = sibling(a, b);
  if (s) return s === 'plein' ? 'frère-sœur' : 'demi-frère-demi-sœur';
  for (const [x, y] of [[a, b], [b, a]]) for (const px of par(x)) { const k = sibling(px, y); if (k) return k === 'plein' ? 'oncle/tante-neveu/nièce' : 'demi-oncle/tante-neveu/nièce'; }
  for (const pa of par(a)) for (const pb of par(b)) if (pa === pb || sibling(pa, pb)) return 'cousins germains';
  return null;
}

/* ───────── 8. succession.json ───────── */
let succ = null;
if (existsSync(successionPath)) {
  succ = load(successionPath, 'succession.json');
  if (succ) {
    const list = Array.isArray(succ.successions) ? succ.successions : (err('succession.json : « successions » doit être un tableau'), []);
    let prevYear = -Infinity;
    for (const s of list) {
      const tag = `succession ${s.from ?? '∅'} → ${s.to}`;
      if (s.from !== null && !byId.has(s.from)) err(`${tag} : from inconnu`);
      if (!byId.has(s.to)) { err(`${tag} : to inconnu`); continue; }
      if (!Number.isInteger(s.year)) err(`${tag} : year invalide`);
      if (s.year < prevYear) err(`${tag} : ordre chronologique rompu`); prevYear = s.year;
      if (!MODES.includes(s.mode)) err(`${tag} : mode invalide (${s.mode})`);
      if (typeof s.relationFr !== 'string' || !s.relationFr) err(`${tag} : relationFr manquant`);
      for (const f of ['contestedBy', 'passedOver']) for (const id of s[f] ?? []) if (!byId.has(id)) err(`${tag} : ${f} inconnu « ${id} »`);
      if (!Array.isArray(s.sources) || !s.sources.length) err(`${tag} : sources vide`);
      const to = byId.get(s.to), from = s.from ? byId.get(s.from) : null;
      if (s.official) {
        if (!to.king) err(`${tag} : passage officiel vers une personne dont king est false`);
        else if (to.reign[0] !== s.year) err(`${tag} : année ${s.year} ≠ début de règne ${to.reign[0]}`);
        if (from && from.king && from.reign[1] !== s.year) err(`${tag} : année ${s.year} ≠ fin de règne de ${from.id} (${from.reign[1]})`);
      }
      if (from) {
        const r = parentsOf.get(s.to);
        const isChild = !!r && (r.father === s.from || r.mother === s.from);
        if (typeof s.parentChild !== 'boolean') err(`${tag} : parentChild manquant`);
        else if (s.parentChild !== isChild) err(`${tag} : parentChild=${s.parentChild} contredit les filiations`);
      }
    }
    // chaque roi apparaît comme successeur officiel une fois
    for (const p of persons.filter((x) => x.king)) {
      const n = list.filter((s) => s.official && s.to === p.id).length;
      if (n !== 1) err(`succession : le roi ${p.id} apparaît ${n} fois comme successeur officiel (attendu 1)`);
    }
  }
}

/* ───────── 9. Statistiques ───────── */
const count = (arr, key) => arr.reduce((m, x) => { const k = typeof key === 'function' ? key(x) : x[key]; m[k] = (m[k] ?? 0) + 1; return m; }, {});
const fmt = (o) => Object.entries(o).map(([k, v]) => `${k} : ${v}`).join(' · ');
const line = (s = '') => console.log(s);

line('══ Généalogie Targaryen — validation ══');
line(`Fichier : ${genealogyPath}`);
line();
line(`Personnes  : ${persons.length}`);
line(`  par maison      : ${fmt(Object.fromEntries(Object.entries(count(persons, 'house')).sort((a, b) => b[1] - a[1])))}`);
line(`  par sexe        : ${fmt(count(persons, 'sex'))}`);
line(`  par légitimité  : ${fmt(count(persons, 'legitimacy'))}`);
line(`  dates           : ${fmt(count(persons, 'dateCertainty'))}`);
line(`  rois (king)     : ${persons.filter((p) => p.king).length} dont ${persons.filter((p) => p.king && p.house === 'targaryen').length} Targaryen`);
line(`  prétendants     : ${persons.filter((p) => p.pretender).length}`);
if (persons.some((p) => 'verifiedOnline' in p)) line(`  vérifiées en ligne : ${persons.filter((p) => p.verifiedOnline).length} / ${persons.length}`);
line(`Unions     : ${unions.length}`);
line(`  par type        : ${fmt(count(unions, 'type'))}`);
line(`  par certitude   : ${fmt(count(unions, 'certainty'))}`);
line(`Filiations : ${parentage.length}`);
line(`  par certitude   : ${fmt(count(parentage, 'certainty'))}`);
line();
const gens = count(persons, 'generation');
const gensBlood = count(persons.filter((p) => parentsOf.has(p.id) || p.generation === 0), 'generation');
const maxGen = Math.max(...persons.map((p) => p.generation).filter(Number.isInteger));
line(`Générations : 0 à ${maxGen}`);
line('  gén. | personnes | dont nées dans l\'arbre');
for (let g = 0; g <= maxGen; g++) line(`  ${String(g).padStart(4)} | ${String(gens[g] ?? 0).padStart(9)} | ${String(gensBlood[g] ?? 0).padStart(4)}  ${'█'.repeat(gens[g] ?? 0)}`);
const widest = Object.entries(gens).sort((a, b) => b[1] - a[1])[0];
const widestBlood = Object.entries(gensBlood).sort((a, b) => b[1] - a[1])[0];
line(`  largeur maximale : ${widest[1]} personnes (génération ${widest[0]}) ; ${widestBlood[1]} nées dans l'arbre (génération ${widestBlood[0]})`);
line();

// analyse des unions
const kin = unions.map((u) => ({ u, k: byId.has(u.partners?.[0]) && byId.has(u.partners?.[1]) ? kinship(u.partners[0], u.partners[1]) : null })).filter((x) => x.k);
const kinCount = count(kin, 'k');
line('Unions entre proches parents (les deux conjoints dans l\'arbre) :');
for (const k of ['frère-sœur', 'demi-frère-demi-sœur', 'oncle/tante-neveu/nièce', 'demi-oncle/tante-neveu/nièce', 'cousins germains']) {
  const items = kin.filter((x) => x.k === k);
  line(`  ${k} : ${items.length}${items.length ? '  [' + items.map((x) => `${x.u.partners.join(' + ')}${x.u.type !== 'mariage' ? ' (' + x.u.type + ')' : ''}`).join(' ; ') + ']' : ''}`);
}
const unionsPer = new Map();
for (const u of unions) for (const pid of u.partners ?? []) unionsPer.set(pid, (unionsPer.get(pid) ?? 0) + 1);
const multi = [...unionsPer.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
line(`Personnes ayant plusieurs unions : ${multi.length}  [${multi.map(([id, n]) => `${id} ×${n}`).join(' ; ')}]`);
const marriagesPer = new Map();
for (const u of unions.filter((x) => x.type === 'mariage')) for (const pid of u.partners ?? []) marriagesPer.set(pid, (marriagesPer.get(pid) ?? 0) + 1);
line(`  dont plusieurs mariages : ${[...marriagesPer.values()].filter((n) => n > 1).length}`);
line();

if (Array.isArray(data.mainThread?.ids)) {
  const ids = data.mainThread.ids;
  const kings = persons.filter((p) => p.king && p.house === 'targaryen');
  const contested = ids.filter((id) => parentsOf.get(id) && parentsOf.get(id).certainty !== 'etabli');
  line(`Fil principal : ${ids.length} personnes, ${ids.length - 1} liens parent-enfant ; ${kings.filter((p) => ids.includes(p.id)).length} rois Targaryen sur ${kings.length} sur le fil ; hors fil : ${kings.filter((p) => !ids.includes(p.id)).map((p) => p.id).join(', ')}`);
  line(`  liens non établis sur le fil : ${contested.length}${contested.length ? ' [' + contested.join(', ') + ']' : ''}`);
  line();
}

if (succ?.successions) {
  const off = succ.successions.filter((s) => s.official && s.from !== null);
  const targ = off.filter((s) => byId.get(s.to)?.house === 'targaryen');
  const pc = targ.filter((s) => s.parentChild).length;
  line(`Successions : ${succ.successions.length} entrées, dont ${off.length} passages officiels (${targ.length} entre rois Targaryen)`);
  line(`  entre rois Targaryen : ${pc} de parent à enfant, ${targ.length - pc} autrement  [${targ.filter((s) => !s.parentChild).map((s) => `${s.from} → ${s.to} (${s.relationFr.split(' (')[0]})`).join(' ; ')}]`);
  line(`  en comptant la chute de la dynastie (283) : ${off.filter((s) => !s.parentChild).length} passages hors parent-enfant sur ${off.length}`);
  line(`  par mode (officiels) : ${fmt(count(off, 'mode'))}`);
  line(`  passages contestés (officiels) : ${off.filter((s) => (s.contestedBy ?? []).length).length}`);
  line();
}

finish();

function finish() {
  if (warnings.length) { console.log(`Avertissements (${warnings.length}) :`); for (const w of warnings) console.log(`  ⚠ ${w}`); console.log(); }
  if (errors.length) {
    console.error(`ERREURS (${errors.length}) :`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log('Résultat : 0 erreur.');
  process.exit(0);
}

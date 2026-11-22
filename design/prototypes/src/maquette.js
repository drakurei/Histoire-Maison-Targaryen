// MAQUETTE INTERACTIVE — Targaryen Chronicles (prototype de conception, pas le site final).
// Données : content/**/*.json (agents 02, 03, 04), injectées telles quelles par build-maquette.mjs.
// Règle de langue (agent 06) : le valyrien tient les rubriques, la langue de lecture porte le récit.
// Aucune chaîne valyrienne n'est écrite dans ce fichier : toutes viennent du lexique par identifiant.

(() => {
  'use strict';

  const D = JSON.parse(document.getElementById('donnees').textContent);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = $('#page');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------ État et langue */

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* stockage indisponible : état en mémoire */ } },
  };
  const browserReading = (navigator.languages ?? [navigator.language ?? 'en']).some((code) => code.toLowerCase().startsWith('fr')) ? 'fr' : 'en';
  const state = {
    mode: ['hv', 'fr', 'en'].includes(store.get('tc-mode')) ? store.get('tc-mode') : 'hv',
    reading: ['fr', 'en'].includes(store.get('tc-lecture')) ? store.get('tc-lecture') : browserReading,
    gloss: store.get('tc-glose') !== '0',
    filters: { adaptation: false, reliability: '' },
    lexStatus: '',
  };
  const R = () => (state.mode === 'hv' ? state.reading : state.mode);

  // Chaînes d'interface absentes du lexique valyrien : affichées dans la langue de lecture (état E1).
  const T = {
    maquette: ['Maquette de conception — quatre choix attendent votre décision', 'Design prototype — four choices await your decision'],
    skip: ['Aller au contenu', 'Skip to content'],
    volume: ['Volume', 'Volume'],
    why: ['pourquoi ?', 'why?'],
    edition: ['Texte en français', 'Text in English'],
    composition: ['Phrase composée pour cette bibliothèque — elle n’est pas tirée des livres', 'Sentence composed for this library — it is not taken from the books'],
    namesFr: ['', 'Names of people and places are shown in French pending translation.'],
    registers: ['Registres', 'Registers'],
    planned: ['prévu en version 1', 'planned for version 1'],
    books: ['Livres', 'Books'],
    adaptation: ['Adaptations télévisées', 'Television adaptations'],
    showAdaptation: ['Montrer aussi les adaptations', 'Also show adaptations'],
    reliability: ['Fiabilité', 'Reliability'],
    all: ['Toutes', 'All'],
    consequence: ['Conséquence', 'Consequence'],
    people: ['Personnes', 'People'],
    dragonsLabel: ['Dragons', 'Dragons'],
    places: ['Lieux', 'Places'],
    sources: ['Sources', 'Sources'],
    noEvents: ['Aucun événement ne correspond à ces filtres.', 'No event matches these filters.'],
    unknown: ['inconnue', 'unknown'],
    generation: ['génération', 'generation'],
    house: ['Maison', 'House'],
    unions: ['Unions', 'Unions'],
    marriage: ['mariage', 'marriage'], liaison: ['liaison', 'liaison'], betrothal: ['fiançailles', 'betrothal'],
    contested: ['contesté', 'contested'], uncertain: ['incertain', 'uncertain'], established: ['établi', 'established'],
    otherChildren: ['Enfants sans union enregistrée', 'Children with no recorded union'],
    eventsCiting: ['Événements où cette personne paraît', 'Events in which this person appears'],
    seeLineage: ['Voir dans la lignée', 'See in the lineage'],
    seeRecord: ['Ouvrir la fiche', 'Open the record'],
    bioPending: ['Notice biographique : elle sera rédigée et sourcée pendant la phase de recherche (tâche B10). Cette maquette montre la structure de la fiche avec les données généalogiques déjà vérifiées.', 'Biography: it will be written and sourced during the research phase (task B10). This prototype shows the record structure with the genealogical data already verified.'],
    lifeline: ['Ligne de vie : chaque cran vaut dix ans ; le trait rouge marque le règne.', 'Lifeline: each tick is ten years; the red stroke marks the reign.'],
    noLifeline: ['Les sources ne donnent pas les deux dates : la ligne de vie n’est pas tracée.', 'The sources do not give both dates: the lifeline is not drawn.'],
    mainThread: ['Fil de filiation', 'Line of descent'],
    findPerson: ['Trouver une personne', 'Find a person'],
    parents: ['Parents', 'Parents'],
    notRecorded: ['non enregistré', 'not recorded'],
    noUnion: ['Aucune union ni descendance enregistrée.', 'No union or descendants recorded.'],
    with: ['avec', 'with'],
    color: ['Écailles', 'Scales'],
    colorUnknown: ['Couleur non décrite dans les livres', 'Colour not described in the books'],
    riders: ['Dragonniers', 'Riders'],
    firstKnown: ['Première mention', 'First known'],
    fate: ['Destin', 'Fate'],
    untranslated: ['', 'Not yet translated — shown in French.'],
    lexIntro: ['Chaque forme valyrienne affichée dans la bibliothèque vient de ce lexique et porte son niveau d’attestation. Rien n’est présenté comme canonique sans l’être.', 'Every Valyrian form shown in the library comes from this lexicon and carries its level of attestation. Nothing is presented as canonical unless it is.'],
    toConfirm: ['forme à confirmer', 'form to be confirmed'],
    reference: ['Référence', 'Reference'],
    analysis: ['Analyse', 'Analysis'],
    levels: ['Niveaux de fiabilité', 'Reliability levels'],
    registry: ['Registre des sources', 'Source registry'],
    continuity: ['Continuité', 'Continuity'],
    searchHint: ['Un nom, un dragon, un événement, un mot', 'A name, a dragon, an event, a word'],
    noResult: ['Aucun résultat.', 'No result.'],
    pageWords: ['Mots valyriens de cette page', 'Valyrian words on this page'],
    replay: ['Revoir l’ouverture', 'Replay the opening'],
    unofficial: ['Œuvre de passionné, non officielle. Univers créé par George R. R. Martin ; haut valyrien créé par David J. Peterson.', 'Unofficial fan work. World created by George R. R. Martin; High Valyrian created by David J. Peterson.'],
    system: ['Système de design', 'Design system'],
    directions: ['Trois directions', 'Three directions'],
    workDocs: ['Documents de la maquette', 'Prototype documents'],
    allMen: ['entrer', 'enter'],
    langAnnounce: ['Langue : français', 'Language: English'],
    langAnnounceHv: ['Langue : haut valyrien, gloses en français', 'Language: High Valyrian, glosses in English'],
    literal: ['Voir ce mot dans la bibliothèque linguistique', 'See this word in the language library'],
    king: ['règne', 'reign'],
    name: ['Nom', 'Name'], dates: ['Dates', 'Dates'],
    shown: ['affiché', 'shown'], hidden: ['masqué', 'hidden'],
    seenIn: ['Voir aussi', 'See also'],
  };
  const t = (key) => T[key][R() === 'fr' ? 0 : 1];

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const fold = (value) => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const STATUS = {
    atteste: ['Attesté', 'Attested'],
    derive: ['Forme dérivée régulièrement', 'Regularly derived form'],
    editorial: ['Composition de la bibliothèque', 'Composed for this library'],
    adaptation: ['Graphie d’origine conservée', 'Original spelling kept'],
    neologisme: ['Néologisme', 'Neologism'],
  };
  const statusLabel = (status) => STATUS[status]?.[R() === 'fr' ? 0 : 1] ?? status;

  /* ------------------------------------------------------------------ Accès aux données */

  const lex = new Map(D.lexicon.map((entry) => [entry.id, entry]));
  const persons = new Map(D.genealogy.persons.map((person) => [person.id, person]));
  const dragons = new Map(D.dragons.map((dragon) => [dragon.id, dragon]));
  const sources = new Map(D.sources.sources.map((source) => [source.id, source]));
  const levels = new Map(D.sources.reliabilityLevels.map((level) => [level.id, level]));
  const personByName = new Map(D.genealogy.persons.flatMap((person) => [[person.nameFr, person], [person.nameEn, person]]));
  const dragonByName = new Map(D.dragons.map((dragon) => [dragon.name, dragon]));
  const parentageOf = new Map(D.genealogy.parentage.map((link) => [link.child, link]));
  const allEvents = D.timeline.periods.flatMap((period) => period.events.map((event) => ({ ...event, period: period.id })));

  const loc = (object, base) => {
    const wanted = object[`${base}${R() === 'fr' ? 'Fr' : 'En'}`];
    return wanted ? { text: wanted, fallback: false } : { text: object[`${base}Fr`] ?? '', fallback: R() === 'en' && Boolean(object[`${base}Fr`]) };
  };
  const personName = (person) => (R() === 'fr' ? person.nameFr : person.nameEn);
  const personEpithet = (person) => (R() === 'fr' ? person.epithetFr : person.epithetEn) ?? '';
  const year = (value) => {
    if (value === null || value === undefined) return t('unknown');
    if (R() === 'fr') return value < 0 ? `${-value} av. C.` : `${value} apr. C.`;
    return value < 0 ? `${-value} BC` : `${value} AC`;
  };
  const lifeDates = (person) => (person.born == null && person.died == null ? '' : `${person.born ?? '?'} – ${person.died ?? '?'}`);
  // Une seule convention d'ère par langue (les libellés de la chronologie emploient encore « AC » en français).
  const eventYear = (event) => (R() === 'fr' ? String(event.yearLabelFr).replace(/\bAC\b/g, 'apr. C.') : event.yearLabelEn);
  /** Texte disponible en français seulement : balisé comme tel quand la langue de lecture est l'anglais. */
  const frOnly = (text) => (R() === 'en' ? `<span lang="fr">${esc(text)}</span>` : esc(text));
  const levelLabel = (id) => { const level = levels.get(id); return level ? (R() === 'fr' ? level.label : level.labelEn) : id; };

  /* ------------------------------------------------------------------ Rubriques valyriennes */

  /** Rubrique : valyrien glosé en mode valyrien, langue choisie sinon. */
  function rub(id, { block = false } = {}) {
    const entry = lex.get(id);
    if (!entry) return `<span>${esc(id)}</span>`;
    if (state.mode !== 'hv') return `<span class="mot">${esc(entry[state.mode])}</span>`;
    return `<span class="hv" lang="art-x-valyrian" data-lex="${esc(id)}">${esc(entry.hv)}</span><span class="glose${block ? ' glose--bloc' : ''}" lang="${R()}"${state.gloss ? '' : ' data-masquee'}>${esc(entry[R()])}</span>`;
  }
  /** Titre : en français/anglais, la forme valyrienne validée est citée en italique. */
  function title(id) {
    const entry = lex.get(id);
    if (state.mode === 'hv') return rub(id, { block: true });
    return `${esc(entry[state.mode])}<span class="cite" lang="art-x-valyrian" data-lex="${esc(id)}">${esc(entry.hv)}</span>`;
  }
  const editionNote = () => (state.mode === 'hv' ? `<p class="mention label">${t('edition')} · <a href="#/apropos">${t('why')}</a></p>` : '');
  const fallbackNote = (flag) => (flag ? `<p class="label">${t('untranslated')}</p>` : '');
  const personLink = (id) => { const person = persons.get(id); return person ? `<a href="#/personne/${esc(id)}">${esc(personName(person))}</a>` : esc(id); };
  const sourceList = (refs) => refs.map((ref) => {
    const id = typeof ref === 'string' ? ref : ref.id;
    const source = sources.get(id);
    const name = source ? (R() === 'fr' && source.titleFr ? `${source.title} (${source.titleFr})` : source.title) : id;
    return `<a href="#/sources">${esc(name)}</a>${ref.locator ? `, ${esc(ref.locator)}` : ''}`;
  }).join(' ; ');

  /* ------------------------------------------------------------------ Vues */

  const REGISTERS = [
    ['nav.genealogy', '#/lignee/aegon-i'], ['nav.characters', '#/personnes'], ['nav.dragons', '#/dragons'],
    ['nav.wars', '#/avenir/guerres', true], ['nav.places', '#/avenir/lieux', true], ['nav.language', '#/langue'],
    ['nav.sources', '#/sources'], ['nav.learn', '#/avenir/apprendre', true], ['nav.about', '#/apropos'],
  ];
  const volumeTable = () => `<ol class="table-volumes">${D.timeline.periods.map((period, index) => `<li><a href="#/periode/${period.id}">
      <span class="num">${ROMAN[index]}</span><span class="nom">${state.mode === 'hv' ? `<span class="hv" lang="art-x-valyrian" data-lex="period.${index + 1}">${esc(lex.get(`period.${index + 1}`).hv)}</span>` : esc(lex.get(`period.${index + 1}`)[state.mode])}</span>
      <span class="conduite"></span><span class="bornes">${period.from == null ? '…' : esc(year(period.from))} – ${esc(year(period.to))}</span>
      ${state.mode === 'hv' ? `<span class="glose glose--bloc" lang="${R()}"${state.gloss ? '' : ' data-masquee'}>${esc(lex.get(`period.${index + 1}`)[R()])}</span>` : `<span class="glose glose--bloc cite" lang="art-x-valyrian">${esc(lex.get(`period.${index + 1}`).hv)}</span>`}
    </a></li>`).join('')}</ol>`;
  const registerList = () => `<ul class="registres">${REGISTERS.map(([id, href, planned]) => `<li><a href="${href}">${rub(id, { block: true })}${planned ? `<span class="etat">${t('planned')}</span>` : ''}</a></li>`).join('')}</ul>`;

  const views = {
    portail() {
      const site = lex.get('title.site');
      const intro = lex.get('text.portal_intro');
      const heading = state.mode === 'hv'
        ? `<h1 class="titre-codex" lang="art-x-valyrian" data-lex="title.site">${site.hv.split(' ').map((word) => `<span>${esc(word)}</span>`).join('')}</h1><p class="glose glose--bloc"${state.gloss ? '' : ' data-masquee'}>${esc(site[R()])}</p>`
        : `<h1 class="titre-codex titre-codex--lecture">${esc(site[state.mode])}</h1><p class="cite" lang="art-x-valyrian" data-lex="title.site">${esc(site.hv)}</p>`;
      const incipit = state.mode === 'hv'
        ? `<p lang="art-x-valyrian" data-lex="text.portal_intro" class="hv">${esc(intro.hv)}</p><p class="glose glose--bloc">${esc(intro[R()])}</p><p class="incipit__statut">${t('composition')}</p>`
        : `<p>${esc(intro[state.mode])}</p><p class="glose glose--bloc" lang="art-x-valyrian" data-lex="text.portal_intro">${esc(intro.hv)}</p><p class="incipit__statut">${t('composition')}</p>`;
      return `<div class="portail">
        <section class="frontispice" aria-labelledby="titre-page">
          <img class="frontispice__sceau" src="${D.sealUri}" alt="" width="120" height="120">
          <div id="titre-page">${heading}</div>
          <div class="filet-losange" aria-hidden="true"><i></i></div>
          <div class="incipit">${incipit}</div>
          <p class="devise"><span lang="art-x-valyrian" data-lex="phrase.motto">${esc(lex.get('phrase.motto').hv)}</span><span class="glose">${esc(lex.get('phrase.motto')[R()])}</span></p>
        </section>
        <section class="folio" data-surface="parchemin" aria-labelledby="titre-table">
          <div class="filet-gm" aria-hidden="true"></div>
          <h2 class="rubrique" id="titre-table">${rub('nav.chronicles')}</h2>
          ${volumeTable()}
          <div class="filet-losange" aria-hidden="true"><i></i></div>
          <h2 class="rubrique">${esc(t('registers'))}</h2>
          ${registerList()}
        </section>
      </div>`;
    },

    periode(id) {
      const index = D.timeline.periods.findIndex((period) => period.id === id);
      const period = D.timeline.periods[index];
      if (!period) return views.erreur();
      const summary = loc(period, 'summary');
      const events = period.events.filter((event) => (state.filters.adaptation || event.continuity !== 'adaptation') && (!state.filters.reliability || event.reliability === state.filters.reliability));
      const usedLevels = [...new Set(period.events.map((event) => event.reliability))].filter((level) => level !== 'adaptation');
      const names = (list, map, route) => list.map((name) => (map.has(name) ? `<a href="#/${route}/${map.get(name).id}">${esc(map.get(name).nameEn && R() === 'en' ? map.get(name).nameEn : name)}</a>` : frOnly(name))).join(', ');
      const rows = events.map((event) => {
        const text = loc(event, 'summary');
        const consequence = loc(event, 'consequence');
        return `<li class="annale" data-continuite="${esc(event.continuity)}"><details>
          <summary><span class="annee">${esc(eventYear(event))}</span><span class="annale__titre">${esc(loc(event, 'title').text)}</span><span class="statut${event.reliability === 'etabli' ? ' statut--atteste' : ''}">${esc(event.continuity === 'adaptation' ? t('adaptation') : levelLabel(event.reliability))}</span></summary>
          <div class="annale__corps">
            <p>${esc(text.text)}</p>
            ${consequence.text ? `<p><span class="label">${t('consequence')}</span><br>${esc(consequence.text)}</p>` : ''}
            <dl>
              ${event.people?.length ? `<dt>${t('people')}</dt><dd>${names(event.people, personByName, 'personne')}</dd>` : ''}
              ${event.dragons?.length ? `<dt>${t('dragonsLabel')}</dt><dd>${names(event.dragons, dragonByName, 'dragon')}</dd>` : ''}
              ${event.places?.length ? `<dt>${t('places')}</dt><dd>${frOnly(event.places.join(', '))}</dd>` : ''}
              <dt>${t('sources')}</dt><dd>${sourceList(event.sources)}</dd>
            </dl>
          </div></details></li>`;
      }).join('');
      const previous = D.timeline.periods[index - 1];
      const next = D.timeline.periods[index + 1];
      const neighbour = (target, offset, labelId) => (target ? `<a href="#/periode/${target.id}"><span class="label">${rub(labelId)}</span>${ROMAN[index + offset]} · ${esc(lex.get(`period.${index + offset + 1}`)[R()])}</a>` : '<span></span>');
      return `<article class="folio folio--large" data-surface="parchemin">
        <nav class="fil-ariane label" aria-label="${esc(lex.get('nav.chronicles')[R()])}"><a href="#/">${rub('nav.portal')}</a><span aria-hidden="true">/</span><span>${rub('nav.chronicles')}</span></nav>
        <header class="tete"><div class="filet-gm" aria-hidden="true"></div>
          <p class="label">${t('volume')} ${ROMAN[index]}</p>
          <h1>${title(`period.${index + 1}`)}</h1>
          <p class="bornes">${period.from == null ? '…' : esc(year(period.from))} – ${esc(year(period.to))}</p>
        </header>
        ${editionNote()}
        <p class="chapo lettrine">${esc(summary.text)}</p>
        <fieldset class="filtres"><legend class="label">${t('reliability')}</legend>
          <div class="filtres__groupe">
            <button class="bouton bouton--petit" data-fiabilite="" aria-pressed="${state.filters.reliability === ''}">${t('all')}</button>
            ${usedLevels.map((level) => `<button class="bouton bouton--petit" data-fiabilite="${esc(level)}" aria-pressed="${state.filters.reliability === level}">${esc(levelLabel(level))}</button>`).join('')}
          </div>
          <div class="filtres__groupe"><button class="bouton bouton--petit" data-adaptation aria-pressed="${state.filters.adaptation}">${t('showAdaptation')}</button></div>
        </fieldset>
        <div class="filet-double" aria-hidden="true"></div>
        ${R() === 'en' ? `<p class="label" style="margin-top:var(--space-3)">${t('namesFr')}</p>` : ''}
        ${rows ? `<ol class="annales">${rows}</ol>` : `<p class="vide">${t('noEvents')}</p>`}
        <div class="filet-double" aria-hidden="true"></div>
        <nav class="suite" aria-label="${t('volume')}">${neighbour(previous, -1, 'action.previous')}${neighbour(next, 1, 'action.next')}</nav>
      </article>`;
    },

    personnes() {
      const list = [...D.genealogy.persons].sort((a, b) => personName(a).localeCompare(personName(b), R()));
      return `<article class="folio folio--large" data-surface="parchemin">
        <header class="tete"><div class="filet-gm" aria-hidden="true"></div><h1>${title('nav.characters')}</h1><p class="bornes">${list.length} · ${list.filter((person) => person.king).length} ${t('king')}s</p></header>
        <div class="table-defile"><table class="registre"><thead><tr><th class="label">${t('name')}</th><th class="label">${t('dates')}</th><th class="label col-secondaire">${t('house')}</th></tr></thead><tbody>
        ${list.map((person) => `<tr><td><a class="nom" href="#/personne/${person.id}">${esc(personName(person))}</a>${personEpithet(person) ? `<br><i>${esc(personEpithet(person))}</i>` : ''}</td><td>${esc(lifeDates(person)) || '—'}${person.reign ? `<br><span class="label">${t('king')} ${person.reign[0]}–${person.reign[1]}</span>` : ''}</td><td class="col-secondaire">${esc(person.house)}</td></tr>`).join('')}
        </tbody></table></div></article>`;
    },

    personne(id) {
      const person = persons.get(id);
      if (!person) return views.erreur();
      const link = parentageOf.get(id);
      const unions = D.genealogy.unions.filter((union) => union.partners.includes(id));
      const childrenOf = (union) => D.genealogy.parentage.filter((item) => item.union === union.id).map((item) => item.child);
      const loose = D.genealogy.parentage.filter((item) => !item.union && (item.father === id || item.mother === id)).map((item) => item.child);
      const events = allEvents.filter((event) => event.people?.includes(person.nameFr) && event.continuity !== 'adaptation');
      const unionType = { mariage: 'marriage', liaison: 'liaison', fiancailles: 'betrothal' };
      const certainty = { etabli: 'established', incertain: 'uncertain', conteste: 'contested' };
      const parent = (key) => (link?.[key] ? personLink(link[key]) : `<span class="cite">${t('notRecorded')}</span>`);
      return `<article class="folio" data-surface="parchemin">
        <nav class="fil-ariane label"><a href="#/">${rub('nav.portal')}</a><span aria-hidden="true">/</span><a href="#/personnes">${rub('nav.characters')}</a></nav>
        <header class="tete"><div class="filet-gm" aria-hidden="true"></div>
          <p class="label">${t('house')} ${esc(person.house)} · ${t('generation')} ${person.generation}</p>
          <h1>${esc(personName(person))}</h1>
          ${personEpithet(person) ? `<p class="epithete">${esc(personEpithet(person))}</p>` : ''}
          <div class="filet-double" aria-hidden="true"></div>
        </header>
        ${lifeline(person)}
        <dl class="identite">
          <dt>${rub('label.born')}</dt><dd>${esc(year(person.born))}</dd>
          <dt>${rub('label.died')}</dt><dd>${person.alive ? '—' : esc(year(person.died))}</dd>
          ${person.reign ? `<dt>${rub('label.reign')}</dt><dd>${esc(year(person.reign[0]))} – ${esc(year(person.reign[1]))}</dd>` : ''}
          <dt>${rub('label.father')}</dt><dd>${parent('father')}</dd>
          <dt>${rub('label.mother')}</dt><dd>${parent('mother')}</dd>
        </dl>
        ${link && link.certainty !== 'etabli' && link.noteFr ? `<p class="note-avenir">${frOnly(link.noteFr)}${R() === 'en' ? ` <span class="label">${t('untranslated')}</span>` : ''}</p>` : ''}
        <p><a class="bouton" href="#/lignee/${esc(id)}">${t('seeLineage')}</a></p>
        <h2 class="section"><span>${rub('label.spouse')}</span><i class="losange" aria-hidden="true"></i><span>${rub('label.children')}</span></h2>
        ${unions.length || loose.length ? `<ul class="liste">
          ${unions.map((union) => { const kids = childrenOf(union); const other = union.partners.find((partner) => partner !== id); return `<li>${personLink(other)}<span class="sous">${t(unionType[union.type] ?? 'marriage')}${union.year != null ? `, ${esc(year(union.year))}` : ''} · ${t(certainty[union.certainty] ?? 'established')}</span>${kids.length ? `<span class="enfants">${kids.map(personLink).join('')}</span>` : ''}</li>`; }).join('')}
          ${loose.length ? `<li>${t('otherChildren')}<span class="enfants">${loose.map(personLink).join('')}</span></li>` : ''}
        </ul>` : `<p class="vide">${t('noUnion')}</p>`}
        ${events.length ? `<h2 class="section">${t('eventsCiting')}</h2><ul class="liste">${events.map((event) => `<li><a href="#/periode/${event.period}">${esc(loc(event, 'title').text)}</a><span class="sous">${esc(eventYear(event))}</span></li>`).join('')}</ul>` : ''}
        <h2 class="section">${t('sources')}</h2><p>${sourceList(person.sources)}</p>
        <p class="note-avenir">${t('bioPending')}</p>
      </article>`;
    },

    lignee(id = 'aegon-i') {
      const person = persons.get(id);
      if (!person) return views.erreur();
      const link = parentageOf.get(id);
      const node = (personId, modifier = '') => {
        const item = persons.get(personId);
        if (!item) return `<span class="noeud noeud--absent"><span class="noeud__nom">${t('notRecorded')}</span></span>`;
        return `<a class="noeud ${item.king ? 'noeud--roi' : ''} ${modifier}" href="#/${modifier ? 'personne' : 'lignee'}/${esc(personId)}"><span class="noeud__nom">${esc(personName(item))}</span>${lifeDates(item) ? `<span class="noeud__dates">${esc(lifeDates(item))}</span>` : ''}${item.reign ? `<span class="label">${t('king')} ${item.reign[0]}–${item.reign[1]}</span>` : ''}${modifier ? `<span class="label">${t('seeRecord')}</span>` : ''}</a>`;
      };
      const unions = D.genealogy.unions.filter((union) => union.partners.includes(id));
      const unionBlocks = unions.map((union) => {
        const kids = D.genealogy.parentage.filter((item) => item.union === union.id);
        const other = union.partners.find((partner) => partner !== id);
        const doubtful = kids.some((item) => item.certainty !== 'etabli');
        return `<div class="union"><p class="union__titre label">${t('with')}</p><div class="rang">${node(other)}</div>${kids.length ? `<div class="trait${doubtful ? ' trait--conteste' : ''}" aria-hidden="true"></div><div class="rang">${kids.map((item) => node(item.child)).join('')}</div>` : ''}</div>`;
      }).join('');
      const loose = D.genealogy.parentage.filter((item) => !item.union && (item.father === id || item.mother === id));
      const thread = D.genealogy.mainThread;
      return `<div class="lignee">
        <aside class="fil" aria-label="${t('mainThread')}"><p class="label">${t('mainThread')}</p><ol>${thread.map((threadId) => `<li${threadId === id ? ' aria-current="true"' : ''}><a href="#/lignee/${threadId}">${esc(personName(persons.get(threadId)))}</a></li>`).join('')}</ol></aside>
        <section class="focale" aria-labelledby="titre-lignee">
          <h1 class="inscription" id="titre-lignee">${rub('nav.genealogy')}</h1>
          <label class="champ" style="margin-top:var(--space-4)"><span class="label">${t('findPerson')}</span><input type="search" id="cherche-personne" autocomplete="off"></label>
          <div class="resultats" id="resultats-personne" hidden></div>
          <p class="label">${t('parents')}</p>
          <div class="rang">${node(link?.father)}${node(link?.mother)}</div>
          <div class="trait${link && link.certainty !== 'etabli' ? ' trait--conteste' : ''}" aria-hidden="true"></div>
          <div class="rang">${node(id, 'noeud--sujet')}</div>
          ${unionBlocks}
          ${loose.length ? `<div class="union"><p class="union__titre label">${t('otherChildren')}</p><div class="rang">${loose.map((item) => node(item.child)).join('')}</div></div>` : ''}
          ${!unions.length && !loose.length ? `<p class="vide">${t('noUnion')}</p>` : ''}
        </section></div>`;
    },

    dragons() {
      return `<section class="stele" style="width:min(100%,var(--width-planche))">
        <header class="tete"><h1>${title('nav.dragons')}</h1><p class="bornes">${D.dragons.length}</p></header>
        <div class="table-defile"><table class="registre"><thead><tr><th><span class="sr">${t('color')}</span></th><th class="label">${rub('label.dragon')}</th><th class="label col-secondaire">${t('color')}</th><th class="label">${rub('label.rider')}</th><th class="label col-secondaire">${rub('label.died')}</th></tr></thead><tbody>
        ${D.dragons.map((dragon) => `<tr><td>${swatch(dragon)}</td><td><a class="nom" href="#/dragon/${dragon.id}">${esc(dragon.name)}</a>${dragon.aliasFr ? `<br><i>${esc(R() === 'fr' ? dragon.aliasFr : dragon.aliasEn ?? dragon.aliasFr)}</i>` : ''}</td><td class="col-secondaire">${dragon.colorFr ? frOnly(dragon.colorFr) : esc(t('colorUnknown'))}</td><td>${dragon.riders.map((rider) => (personByName.has(rider.name) ? personLink(personByName.get(rider.name).id) : frOnly(rider.name))).join(', ') || '—'}</td><td class="col-secondaire">${dragon.died == null ? '—' : esc(year(dragon.died))}</td></tr>`).join('')}
        </tbody></table></div>${R() === 'en' ? `<p class="label" style="margin-top:var(--space-4)">${t('untranslated')}</p>` : ''}</section>`;
    },

    dragon(id) {
      const dragon = dragons.get(id);
      if (!dragon) return views.erreur();
      return `<article class="stele">
        <nav class="fil-ariane label"><a href="#/">${rub('nav.portal')}</a><span aria-hidden="true">/</span><a href="#/dragons">${rub('nav.dragons')}</a></nav>
        ${swatch(dragon, true)}
        <header class="tete" style="margin-top:var(--space-5)"><h1>${esc(dragon.name)}</h1>${dragon.aliasFr ? `<p class="epithete">${esc(R() === 'fr' ? dragon.aliasFr : dragon.aliasEn ?? dragon.aliasFr)}</p>` : ''}</header>
        ${fallbackNote(R() === 'en')}
        <dl class="identite">
          <dt>${t('color')}</dt><dd>${dragon.colorFr ? frOnly(dragon.colorFr) : esc(t('colorUnknown'))}</dd>
          <dt>${rub('label.rider')}</dt><dd>${dragon.riders.map((rider) => `${personByName.has(rider.name) ? personLink(personByName.get(rider.name).id) : frOnly(rider.name)}${rider.from != null || rider.to != null ? ` (${rider.from ?? '…'}–${rider.to ?? '…'})` : ''}`).join('<br>') || '—'}</dd>
          <dt>${t('firstKnown')}</dt><dd>${frOnly(dragon.hatchedOrFirstKnown ?? '—')}</dd>
          <dt>${rub('label.died')}</dt><dd>${dragon.died == null ? '—' : esc(year(dragon.died))}</dd>
          <dt>${t('reliability')}</dt><dd>${esc(levelLabel(dragon.reliability))}</dd>
        </dl>
        <h2 class="section">${t('fate')}</h2><p style="max-width:var(--measure-lecture)">${frOnly(dragon.fateFr)}</p>
        <h2 class="section">${t('sources')}</h2><p>${sourceList(dragon.sources)}</p>
      </article>`;
    },

    langue() {
      const counts = D.lexicon.reduce((acc, entry) => ({ ...acc, [entry.status]: (acc[entry.status] ?? 0) + 1 }), {});
      const entries = D.lexicon.filter((entry) => !state.lexStatus || entry.status === state.lexStatus);
      return `<article class="folio folio--large" data-surface="parchemin">
        <header class="tete"><div class="filet-gm" aria-hidden="true"></div><h1>${title('nav.language')}</h1></header>
        ${editionNote()}<p class="chapo">${t('lexIntro')}</p>
        <div class="compte">${Object.entries(counts).map(([status, count]) => `<p><b>${count}</b><span class="label">${esc(statusLabel(status))}</span></p>`).join('')}</div>
        <div class="filtres__groupe"><button class="bouton bouton--petit" data-statut="" aria-pressed="${state.lexStatus === ''}">${t('all')}</button>${Object.keys(counts).map((status) => `<button class="bouton bouton--petit" data-statut="${status}" aria-pressed="${state.lexStatus === status}">${esc(statusLabel(status))}</button>`).join('')}</div>
        <div class="filet-double" aria-hidden="true" style="margin-top:var(--space-4)"></div>
        <ul>${entries.map((entry) => `<li class="mot" id="mot-${esc(entry.id)}"><details><summary><span class="hv" lang="art-x-valyrian">${esc(entry.hv)}</span><span class="sens">${esc(entry[R()])}</span><span class="statut statut--${entry.status}">${esc(statusLabel(entry.status))}</span></summary>
          <div class="mot__corps">${entry.verifie_en_ligne ? '' : `<p class="label">${t('toConfirm')}</p>`}<p><span class="label">${t('analysis')}</span><br>${frOnly(entry.notes)}</p>${R() === 'en' ? `<p class="label">${t('untranslated')}</p>` : ''}${entry.refs?.length ? `<p><span class="label">${t('reference')}</span><br>${entry.refs.map(esc).join('<br>')}</p>` : ''}</div></details></li>`).join('')}</ul>
      </article>`;
    },

    sources() {
      return `<article class="folio folio--large" data-surface="parchemin">
        <header class="tete"><div class="filet-gm" aria-hidden="true"></div><h1>${title('nav.sources')}</h1></header>
        ${editionNote()}
        <h2 class="section">${t('levels')}</h2>
        <ul class="liste">${D.sources.reliabilityLevels.map((level) => `<li><span class="statut${level.id === 'etabli' ? ' statut--atteste' : ''}">${esc(R() === 'fr' ? level.label : level.labelEn)}</span><span class="sous" style="font-size:var(--fs-body);color:inherit;margin-top:var(--space-2)">${esc(R() === 'fr' ? level.definition : level.definitionEn ?? level.definition)}</span></li>`).join('')}</ul>
        <h2 class="section">${t('registry')}</h2>
        <ul class="liste">${D.sources.sources.map((source) => `<li><b>${esc(source.title)}</b>${source.titleFr && R() === 'fr' ? ` — <i>${esc(source.titleFr)}</i>` : ''}<span class="sous">${esc([source.author, source.year, source.type, `${t('continuity')} : ${source.continuity === 'livres' ? t('books') : source.continuity}`].filter(Boolean).join(' · '))}</span><span class="sous" style="max-width:var(--measure-lecture)">${frOnly(source.reliabilityNote)}</span></li>`).join('')}</ul>
        ${R() === 'en' ? `<p class="label">${t('untranslated')}</p>` : ''}
      </article>`;
    },

    systeme() {
      const groups = [
        ['Pierre — structure', ['obsidienne', 'basalte', 'scorie', 'cendre', 'tuf', 'fumee', 'ponce', 'pierre-claire']],
        ['Sang — identité', ['sang-caille', 'cramoisi', 'rouge-targaryen', 'braise', 'rubrique']],
        ['Métal — mise en valeur', ['bronze-sombre', 'bronze', 'or-ancien', 'or-pale']],
        ['Documents et encres', ['ivoire', 'velin', 'parchemin', 'parchemin-ombre', 'encre', 'sepia', 'bistre', 'bronze-encre']],
      ];
      const css = getComputedStyle(document.documentElement);
      const curves = ['pierre', 'page', 'braise', 'encre', 'souffle', 'chute', 'sceau'];
      return `<div class="colonne" lang="fr">
        <header class="tete"><p class="label">Document de travail de la maquette · rédigé en français, hors du site</p><h1>Système de design</h1></header>
        <p>Jetons du directeur artistique (agent 07) et système typographique mesuré par l’agent 08. Les valeurs affichées ici sont lues dans les jetons chargés par cette page : la planche ne peut pas diverger du système.</p>
        ${groups.map(([name, tokens]) => `<h2 class="section">${name}</h2><div class="nuancier">${tokens.map((token) => { const value = css.getPropertyValue(`--color-${token}`).trim(); return `<div class="teinte"><i style="background:${value}"></i><p>${token}<code>${value}</code></p></div>`; }).join('')}</div>`).join('')}
        <h2 class="section">Trois voix typographiques</h2>
        <div class="specimen">
          <div><p class="label">Affichage · Cormorant Garamond · inscriptions</p><p class="inscription" style="font-size:var(--fs-h3)">Zaldrīzoti Lilion · Ȳ Ā Ē Ī Ō Ū</p><p style="font:500 var(--fs-h1)/1.08 var(--font-display)">Āegon se zaldrīzes</p></div>
          <div><p class="label">Lecture · Alegreya</p><p style="max-width:var(--measure-lecture)">La lecture longue se fait sur parchemin, en garalde, avec de vraies italiques : <i>ā ē ī ō ū ȳ ñ</i>, « guillemets », œ, et des chiffres elzéviriens — 129 apr. C., 1 234 567 890.</p></div>
          <div><p class="label">Étiquettes · Alegreya SC · petites capitales réelles</p><p class="label" style="font-size:var(--fs-body)">Sitta · Morghūltas · Jemēbagon · Kepa · Muña</p></div>
        </div>
        <h2 class="section">Filets</h2>
        <div class="specimen"><div><p class="label">Gras-maigre — ouverture de volume, tête de fiche</p><div class="filet-gm"></div></div><div><p class="label">Double — tête et pied des annales</p><div class="filet-double"></div></div><div><p class="label">À losange — fin de chapitre</p><div class="filet-losange"><i></i></div></div></div>
        <h2 class="section">Contrôles</h2>
        <p><button class="bouton">Bouton sur pierre</button> <button class="bouton" aria-pressed="true">État actif</button> <span class="statut statut--atteste">attesté</span> <span class="statut">dérivé</span> <span class="statut statut--editorial">composition</span></p>
        <div data-surface="parchemin" class="folio" style="margin:0"><p><button class="bouton">Bouton sur parchemin</button> <button class="bouton" aria-pressed="true">État actif</button> <a href="#/systeme">Lien en rubrique</a></p></div>
        <h2 class="section">Matières</h2>
        <div class="nuancier"><div class="teinte"><i style="background:var(--color-basalte) var(--texture-pierre)"></i><p>Pierre volcanique<code>le lieu</code></p></div><div class="teinte"><i style="background:var(--color-parchemin) var(--texture-parchemin)"></i><p>Parchemin<code>la lecture longue</code></p></div><div class="teinte"><i class="ecaille" style="--teinte:var(--color-cramoisi);width:auto;border:0"></i><p>Écailles<code>les dragons seuls</code></p></div><div class="teinte"><i style="background:var(--hachure);color:var(--color-bronze)"></i><p>Gravure<code>remplace les dégradés</code></p></div></div>
        <h2 class="section">Mouvement : cinq causes, sept courbes</h2>
        <p><button class="bouton bouton--petit" id="rejouer-courbes">Rejouer</button></p>
        <div class="courbes">${curves.map((curve) => `<div class="courbe"><span class="label">--ease-${curve}</span><div class="courbe__piste"><span class="courbe__mobile" data-courbe="${curve}"></span></div></div>`).join('')}</div>
        <h2 class="section">Sceau</h2>
        <p><img src="${D.sealUri}" alt="Sceau de la bibliothèque : une chandelle de verre allumée dans une amande, entourée d’un anneau d’écailles et de quatorze flammes." width="280" height="280"> <img src="${D.sealUri}" alt="" width="96" height="96"> <img src="${D.sealUri}" alt="" width="40" height="40"></p>
      </div>`;
    },

    directions() {
      const sketch = { v1: '<rect x="70" y="14" width="100" height="132" fill="#E5D6B5"/><path d="M84 34h72M84 44h72M84 60h60M84 70h66M84 80h54M84 90h66M84 100h58M84 110h64" stroke="#624A30" stroke-width="1.5"/><path d="M176 30h10M176 44h10M176 58h10M176 72h10" stroke="#A8854D" stroke-width="5"/>',
        v2: '<path d="M60 0v160" stroke="#C42230" stroke-width="2.5"/><path d="M60 30l5 5-5 5-5-5zM60 78l5 5-5 5-5-5zM60 126l5 5-5 5-5-5z" fill="#0B0A0A" stroke="#C42230" stroke-width="2"/><path d="M76 30h56M76 38h40M76 78h64M76 86h44M76 126h50" stroke="#B9B1A6" stroke-width="1.5"/><text x="150" y="112" font-family="serif" font-size="92" fill="#2B2622">V</text>',
        v3: '<rect x="18" y="16" width="118" height="104" fill="#E5D6B5"/><path d="M30 34h94M30 44h80M30 54h88M30 64h70M30 74h86" stroke="#624A30" stroke-width="1.5"/><path d="M152 12v112" stroke="#C42230" stroke-width="5"/><path d="M18 138h204" stroke="#A8854D" stroke-width="1.5"/><path d="M18 132v12M44 134v8M70 132v12M96 134v8M122 132v12M148 134v8M174 132v12M200 134v8M222 132v12" stroke="#A8854D" stroke-width="1"/><rect x="170" y="30" width="48" height="62" fill="#F3ECDC"/>' };
      const cards = [
        ['v1', 'Version 1 — Le Codex', 'Fidèle au cahier des charges', [['Métaphore', 'Un seul livre, ouvert sur un lutrin de pierre.'], ['Geste', 'Tourner la page.'], ['Surface', 'Parchemin posé sur la pierre, symétrie centrale.'], ['Arbre', 'Planche dépliante, arbre à focale.'], ['Temps', 'Annales en table.'], ['Mouvement', '2 sur 5 : page tournée, encre des filets.'], ['Entrée', 'Le site s’ouvre seul après la réponse rituelle.']]],
        ['v2', 'Version 2 — La Lignée', 'Proposition alternative des agents', [['Métaphore', 'Un fil rouge que l’on descend, de la première génération à la dernière.'], ['Geste', 'Descendre.'], ['Surface', 'Pierre sombre, asymétrique, aucun parchemin.'], ['Arbre', 'L’épine dorsale du site (fil de filiation, pas de couronne).'], ['Temps', 'Le défilement.'], ['Mouvement', '4 sur 5 : le fil se trace, les stèles se posent.'], ['Réserve', 'Performance mobile ; aucun menu visible : à éprouver.']]],
        ['v3', 'Version 3 — La Table d’étude', 'Hypothèse de fusion, à confirmer après comparaison', [['Métaphore', 'La table de l’archiviste : un codex, un ruban, une règle.'], ['Geste', 'Poser, croiser.'], ['Surface', 'Pierre, parchemin dessus, grille asymétrique.'], ['Arbre', 'Arbre à focale, ruban de lignée permanent.'], ['Temps', 'Réglette que l’on fait glisser.'], ['Mouvement', '3 sur 5 : cérémoniel aux seuils, immobile en lecture.'], ['Condition', 'Dépend de ce que la comparaison réelle de V1 et V2 montrera.']]],
      ];
      return `<div class="colonne" lang="fr">
        <header class="tete"><p class="label">Document de travail de la maquette · rédigé en français, hors du site</p><h1>Trois directions</h1></header>
        <p>Même contenu, mêmes jetons, même sceau : les trois versions diffèrent par la métaphore, la composition, la navigation et le mouvement. Cette maquette interactive montre la direction 1 ; les directions 2 et 3 sont décrites ici et seront construites aux phases F et H.</p>
        <div class="trois">${cards.map(([key, name, subtitle, rows]) => `<section class="direction"><svg viewBox="0 0 240 160" role="img" aria-label="Schéma de composition : ${name}">${sketch[key]}</svg><h3>${name}</h3><p class="label">${subtitle}</p><dl>${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></section>`).join('')}</div>
      </div>`;
    },

    apropos() {
      const counts = D.lexicon.reduce((acc, entry) => ({ ...acc, [entry.status]: (acc[entry.status] ?? 0) + 1 }), {});
      const fr = R() === 'fr';
      return `<article class="folio" data-surface="parchemin">
        <header class="tete"><div class="filet-gm" aria-hidden="true"></div><h1>${title('nav.about')}</h1></header>
        <div class="prose">
          <h2 class="section" id="langue">${fr ? 'Note sur la langue' : 'A note on the language'}</h2>
          <p>${fr ? `Le haut valyrien est une langue construite par David J. Peterson. Son lexique publié ne contient pas le vocabulaire d’un historien. Cette bibliothèque écrit donc en valyrien ce qui peut l’être avec certitude — navigation, titres, étiquettes, formules, courts incipit — et donne le récit dans votre langue.` : `High Valyrian is a language constructed by David J. Peterson. Its published lexicon does not hold a historian’s vocabulary. This library therefore writes in Valyrian what can be written with certainty — navigation, titles, labels, formulas, short incipits — and gives the narrative in your language.`}</p>
          <p>${fr ? `Chaque forme valyrienne porte son niveau d’attestation : ${counts.atteste} attestées, ${counts.derive} dérivées régulièrement, ${counts.editorial} composées pour la bibliothèque, ${counts.adaptation ?? 0} nom laissé dans sa graphie d’origine. Touchez un mot souligné en pointillé pour lire son analyse.` : `Every Valyrian form carries its level of attestation: ${counts.atteste} attested, ${counts.derive} regularly derived, ${counts.editorial} composed for the library, ${counts.adaptation ?? 0} name kept in its original spelling. Touch a dotted-underlined word to read its analysis.`}</p>
          <h2 class="section">${fr ? 'Le sceau' : 'The seal'}</h2>
          <p>${fr ? `Le sceau de la bibliothèque est un dessin original : une chandelle de verre, ces lames d’obsidienne que les livres disent venues de Valyria, entourée d’un anneau d’écailles et de quatorze flammes. Il n’est l’emblème d’aucune maison.` : `The library’s seal is an original drawing: a glass candle — the obsidian blades the books say came from Valyria — within a ring of scales and fourteen flames. It is the emblem of no house.`}</p>
          <h2 class="section">${fr ? 'Les sources' : 'The sources'}</h2>
          <p>${fr ? `Les faits viennent des ouvrages de George R. R. Martin ; les adaptations télévisées sont traitées à part et ne sont jamais mêlées aux livres. Les résumés sont originaux. Chaque événement indique sa fiabilité et ses sources.` : `Facts come from the works of George R. R. Martin; television adaptations are treated separately and never merged with the books. Summaries are original. Every event states its reliability and its sources.`}</p>
        </div>
        <div class="filet-losange" aria-hidden="true"><i></i></div>
        <p class="label" style="text-align:center">${t('unofficial')}</p>
      </article>`;
    },

    avenir(key) {
      const info = { guerres: ['nav.wars', 'W08', 'batailles, camps, alliances, issue et conséquences'], lieux: ['nav.places', 'W09', 'liste et carte originale au trait de Valyria, Peyredragon, Port-Réal, Harrenhal et des lieux des événements'], apprendre: ['nav.learn', 'W12', 'parcours progressifs et questionnaires sobres'] }[key];
      if (!info) return views.erreur();
      return `<article class="folio" data-surface="parchemin"><header class="tete"><div class="filet-gm" aria-hidden="true"></div><h1>${title(info[0])}</h1></header>
        <p class="note-avenir">Cet espace n’est pas maquetté en interactif. Il est spécifié dans <code>design/wireframes/wireframes.md</code> (${info[1]}) : ${info[2]}. Il sera construit en version 1.</p></article>`;
    },

    erreur() {
      return `<article class="stele"><header class="tete"><p class="label">404</p><h1>${title('phrase.not_found')}</h1></header><p><a class="bouton" href="#/">${rub('action.back')}</a></p></article>`;
    },
  };

  /* ------------------------------------------------------------------ Figures */

  const SCALE_TINTS = { noir: '#1a1614', argent: '#b9bcc0', bleu: '#5d7fa3', bronze: '#9a6b3a', rouge: '#a3222c', jaune: '#c9a227', gris: '#8d8f8c', or: '#d4af56', vert: '#4f7350', brun: '#6b5238', rose: '#d6a3a8', creme: '#e6dcc0' };
  function swatch(dragon, banner = false) {
    const tint = SCALE_TINTS[dragon.colorKey];
    const label = dragon.colorFr ?? t('colorUnknown');
    return `<span class="ecaille${tint ? '' : ' ecaille--inconnue'}${['noir', 'brun'].includes(dragon.colorKey) ? ' ecaille--sombre' : ''}${banner ? ' ecaille--bandeau' : ''}" style="${tint ? `--teinte:${tint}` : ''}" role="img" aria-label="${esc(label)}"></span>`;
  }

  /** Ligne de vie : la « tête » d'une fiche est dessinée par ses dates, pas par un portrait. */
  function lifeline(person) {
    if (person.born == null || person.died == null) return `<figure class="ligne-de-vie"><figcaption>${t('noLifeline')}</figcaption></figure>`;
    const width = 600;
    const span = Math.max(person.died - person.born, 1);
    const x = (value) => 20 + ((value - person.born) / span) * (width - 40);
    const ticks = [];
    for (let decade = Math.ceil(person.born / 10) * 10; decade <= person.died; decade += 10) ticks.push(`<path class="cran" d="M${x(decade).toFixed(1)} 36v8"/>`);
    const reign = person.reign ? `<path class="regne" d="M${x(Math.max(person.reign[0], person.born)).toFixed(1)} 40H${x(Math.min(person.reign[1], person.died)).toFixed(1)}"/><text x="${x((person.reign[0] + person.reign[1]) / 2).toFixed(1)}" y="24" text-anchor="middle">${t('king')} ${person.reign[0]}–${person.reign[1]}</text>` : '';
    return `<figure class="ligne-de-vie"><svg viewBox="0 0 ${width} 70" role="img" aria-label="${esc(`${personName(person)} : ${year(person.born)} – ${year(person.died)}`)}">
      <path class="axe" d="M20 40H${width - 20}"/>${ticks.join('')}${reign}
      <path class="borne" d="M20 30v20M${width - 20} 30v20"/>
      <text x="20" y="66">${esc(year(person.born))}</text><text x="${width - 20}" y="66" text-anchor="end">${esc(year(person.died))}</text>
    </svg><figcaption>${t('lifeline')}</figcaption></figure>`;
  }

  /* ------------------------------------------------------------------ Barre, Index, recherche, pied */

  const candleIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M10.5 12.5h3V21h-3z"/><path fill="currentColor" stroke="none" d="M12 2.5c.9 2.4 2.6 3.7 2.6 5.6a2.6 2.6 0 0 1-5.2 0c0-1.9 1.7-3.2 2.6-5.6z"/></svg>';
  const langSwitch = (words) => `<div class="langues${words ? ' langues--mots' : ''}" role="group" aria-label="${esc(lex.get('action.language')[R()])}">
      <button type="button" data-langue="hv" lang="art-x-valyrian" aria-pressed="${state.mode === 'hv'}" aria-label="${esc(lex.get('nav.language').fr)} / ${esc(lex.get('nav.language').en)}">${words ? esc(lex.get('nav.language').hv) : 'HV'}</button>
      <button type="button" data-langue="fr" lang="fr" aria-pressed="${state.mode === 'fr'}" aria-label="Français">${words ? 'Français' : 'FR'}</button>
      <button type="button" data-langue="en" lang="en" aria-pressed="${state.mode === 'en'}" aria-label="English">${words ? 'English' : 'EN'}</button></div>`;

  function renderChrome() {
    document.documentElement.lang = R();
    $('#bandeau').textContent = t('maquette');
    $('#evitement').textContent = t('skip');
    $('#index').setAttribute('aria-label', lex.get('action.menu')[R()]);
    $('#recherche').setAttribute('aria-label', lex.get('action.search')[R()]);
    $('#marque-nom').textContent = lex.get('title.house')[state.mode];
    if (state.mode === 'hv') $('#marque-nom').lang = 'art-x-valyrian'; else $('#marque-nom').removeAttribute('lang');
    $('#outils').innerHTML = `
      <button type="button" class="outil" id="ouvrir-index"><span class="outil__mot">${rub('action.menu', { block: true })}</span></button>
      <button type="button" class="outil outil--icone" id="ouvrir-recherche" aria-label="${esc(lex.get('action.search')[R()])}">${candleIcon}<span><span class="outil__mot">${rub('action.search', { block: true })}</span></span></button>
      ${langSwitch(false)}
      ${state.mode === 'hv' ? `<button type="button" class="outil" id="bascule-glose" aria-pressed="${state.gloss}"><span class="outil__mot">${esc(lex.get('label.meaning').hv)}</span><span class="glose glose--bloc">${esc(lex.get('label.meaning')[R()])} : ${state.gloss ? t('shown') : t('hidden')}</span></button>` : ''}`;
    $('#pied').innerHTML = `
      <span lang="art-x-valyrian" data-lex="phrase.motto">${esc(lex.get('phrase.motto').hv)}</span>
      <button type="button" id="mots-page"></button>
      <a href="#/apropos">${esc(lex.get('nav.about')[R()])}</a>
      <a href="#/systeme">${t('system')}</a><a href="#/directions">${t('directions')}</a>
      <button type="button" id="rejouer-seuil">${t('replay')}</button>
      <span>${t('unofficial')}</span>
      <svg class="marque-jd" viewBox="0 0 24 24" role="img" aria-label="J.D."><path fill="none" stroke="currentColor" stroke-width="1.5" d="M10.5 16.5V4H12.5A8 8 0 0 1 12.5 20H7A3.5 3.5 0 0 1 3.5 16.5V15"/><path fill="currentColor" d="M15 10.25L16.75 12L15 13.75L13.25 12Z"/></svg>`;
    renderSeuilTexts();
  }

  function openIndex() {
    const dialog = $('#index');
    dialog.innerHTML = `<div class="feuillet__tete"><p class="inscription">${rub('action.menu')}</p><button type="button" class="bouton bouton--petit" data-fermer>${rub('action.close')}</button></div>
      <div class="index"><section><h2 class="rubrique">${rub('nav.chronicles')}</h2>${volumeTable()}</section>
      <section><h2 class="rubrique">${t('registers')}</h2>${registerList()}<h2 class="rubrique" style="margin-top:var(--space-6)">${t('workDocs')}</h2><ul class="registres"><li><a href="#/systeme">${t('system')}</a></li><li><a href="#/directions">${t('directions')}</a></li></ul><div style="margin-top:var(--space-6)">${langSwitch(true)}</div>${state.mode === 'hv' ? `<p style="margin-top:var(--space-4)"><button type="button" class="bouton bouton--petit" id="bascule-glose-index" aria-pressed="${state.gloss}">${esc(lex.get('label.meaning').hv)} · ${esc(lex.get('label.meaning')[R()])} : ${state.gloss ? t('shown') : t('hidden')}</button></p>` : ''}</section></div>`;
    // L'Index reste toujours glosé : c'est le filet de sécurité.
    $$('.glose[data-masquee]', dialog).forEach((gloss) => gloss.removeAttribute('data-masquee'));
    if (!dialog.open) dialog.showModal();
  }

  let searchIndex = null;
  function search(query) {
    searchIndex ??= [
      ...D.genealogy.persons.map((person) => ({ key: fold(`${person.nameFr} ${person.nameEn} ${person.epithetFr ?? ''} ${person.epithetEn ?? ''}`), label: () => personName(person), kind: 'label.house', href: `#/personne/${person.id}` })),
      ...D.dragons.map((dragon) => ({ key: fold(`${dragon.name} ${dragon.aliasFr ?? ''} ${dragon.aliasEn ?? ''}`), label: () => dragon.name, kind: 'label.dragon', href: `#/dragon/${dragon.id}` })),
      ...allEvents.map((event) => ({ key: fold(`${event.titleFr} ${event.titleEn}`), label: () => `${loc(event, 'title').text} (${eventYear(event)})`, kind: 'label.age', href: `#/periode/${event.period}` })),
      ...D.lexicon.map((entry) => ({ key: fold(`${entry.hv} ${entry.fr} ${entry.en}`), label: () => `${entry.hv} — ${entry[R()]}`, kind: 'label.word', href: '#/langue' })),
    ];
    const needle = fold(query.trim());
    return needle.length < 2 ? [] : searchIndex.filter((item) => item.key.includes(needle)).slice(0, 40);
  }
  function openSearch() {
    const dialog = $('#recherche');
    dialog.innerHTML = `<div class="feuillet__tete"><p class="inscription">${rub('action.search')}</p><button type="button" class="bouton bouton--petit" data-fermer>${rub('action.close')}</button></div>
      <label class="champ" style="width:100%"><span class="label">${t('searchHint')}</span><input type="search" id="champ-recherche" autocomplete="off"></label><div id="resultats-recherche" aria-live="polite"></div>`;
    dialog.showModal();
    $('#champ-recherche').focus();
  }

  /* ------------------------------------------------------------------ Note de glose */

  function closeGloss() { $('#note-glose')?.remove(); }
  function openGloss(target) {
    closeGloss();
    const entry = lex.get(target.dataset.lex);
    if (!entry) return;
    const note = document.createElement('aside');
    note.id = 'note-glose';
    note.className = 'note-glose';
    note.setAttribute('role', 'note');
    note.innerHTML = `<span class="hv" lang="art-x-valyrian">${esc(entry.hv)}</span><span>${esc(entry[R()])}</span>
      <span class="statut">${esc(statusLabel(entry.status))}${entry.verifie_en_ligne ? '' : ` · ${t('toConfirm')}`}</span>
      <span>${esc(entry.notes.length > 260 ? `${entry.notes.slice(0, 260)}…` : entry.notes)}</span>
      <a href="#/langue">${t('literal')}</a>`;
    document.body.append(note);
    const box = target.getBoundingClientRect();
    const left = Math.max(16, Math.min(box.left + scrollX, scrollX + innerWidth - note.offsetWidth - 16));
    note.style.left = `${left}px`;
    note.style.top = `${box.bottom + scrollY + 8}px`;
  }

  /* ------------------------------------------------------------------ Routeur et rendu */

  function route() {
    const [name = '', arg] = location.hash.replace(/^#\/?/, '').split('/');
    if (name === '') return views.portail();
    return views[name] && name !== 'erreur' ? views[name](arg ? decodeURIComponent(arg) : undefined) : views.erreur();
  }

  function afterRender() {
    const count = new Set($$('[data-lex]', page).map((node) => node.dataset.lex)).size;
    $('#mots-page').textContent = `${t('pageWords')} (${count})`;
    page.dataset.route = location.hash.replace(/^#\/?/, '');
    document.title = `${($('h1', page)?.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 70)} — Targaryen Chronicles (maquette)`;
  }

  let rendering = Promise.resolve();
  let renderToken = 0;
  function render({ transition = true } = {}) {
    const token = ++renderToken;
    rendering = rendering.then(async () => {
      if (token !== renderToken) return; // une navigation plus récente a pris le relais
      if (transition && page.dataset.route === location.hash.replace(/^#\/?/, '')) return; // cette adresse est déjà affichée
      closeGloss();
      const animated = transition && !reduceMotion.matches && page.childElementCount > 0;
      if (animated) await page.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 160, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' }).finished;
      page.innerHTML = route();
      afterRender();
      if (transition) { scrollTo(0, 0); if (!page.inert) page.focus({ preventScroll: true }); }
      // Page tournée (V1) : voile horizontal, propriété composée seulement.
      if (animated) page.animate([{ clipPath: 'inset(0 100% 0 0)', opacity: 0.6 }, { clipPath: 'inset(0 0 0 0)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(0.22, 0.61, 0.21, 1)' });
    });
    return rendering;
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode !== 'hv') state.reading = mode;
    store.set('tc-mode', state.mode);
    store.set('tc-lecture', state.reading);
    renderChrome();
    render({ transition: false });
    if ($('#index').open) openIndex();
    $('#annonce').textContent = mode === 'hv' ? t('langAnnounceHv') : t('langAnnounce');
  }

  /* ------------------------------------------------------------------ Seuil (écran d'ouverture) */

  const seuil = $('#seuil');
  const timers = [];
  let autoEnter = null;
  const SEQUENCE_CLASSES = ['is-trace', 'is-anneau', 'is-salut', 'is-ouvert', 'is-allume', 'is-pret'];

  function renderSeuilTexts() {
    if (!seuil) return;
    const hello = lex.get('phrase.valar_morghulis');
    const answer = lex.get('phrase.valar_dohaeris');
    $('#seuil-salut').textContent = hello.hv;
    $('#seuil-glose').textContent = hello[R()];
    $('#seuil-reponse').textContent = answer.hv;
    $('#seuil-reponse-glose').textContent = `${answer[R()]} · ${t('allMen')}`;
    $('#seuil-langues').innerHTML = langSwitch(true);
  }
  function lightFlame(number) {
    const id = String(number).padStart(2, '0');
    $(`#flamme-${id}`, seuil)?.classList.add('allumee');
    $(`#ecailles-${id}`, seuil)?.classList.add('chaud');
    $('#seuil-jauge').setAttribute('aria-valuenow', String(number));
  }
  function ready() {
    seuil.classList.add('is-pret');
    autoEnter = setTimeout(enter, 1500);
  }
  function skipToReady() {
    if (seuil.classList.contains('is-pret')) return;
    timers.splice(0).forEach(clearTimeout);
    for (let flame = 1; flame <= 14; flame += 1) lightFlame(flame);
    SEQUENCE_CLASSES.slice(0, -1).forEach((name) => seuil.classList.add(name));
    ready();
  }
  function playSeuil() {
    const at = (delay, action) => timers.push(setTimeout(action, delay));
    if (reduceMotion.matches) { skipToReady(); return; }
    at(20, () => seuil.classList.add('is-trace'));
    at(300, () => seuil.classList.add('is-anneau'));
    at(500, () => seuil.classList.add('is-salut'));
    // Les flammes 1 à 13 suivent la cadence minimale ; la quatorzième attend que les polices soient réellement prêtes.
    for (let flame = 1; flame <= 13; flame += 1) at(600 + flame * 70, () => lightFlame(flame));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    at(600 + 14 * 70, () => fontsReady.then(() => {
      if (seuil.classList.contains('is-pret')) return;
      lightFlame(14);
      at(120, () => seuil.classList.add('is-ouvert'));
      at(690, () => seuil.classList.add('is-allume'));
      at(1140, ready);
    }));
  }
  function enter() {
    if (!seuil || seuil.classList.contains('is-passage')) return;
    clearTimeout(autoEnter);
    timers.splice(0).forEach(clearTimeout);
    try { sessionStorage.setItem('tc-seuil', '1'); } catch { /* sans stockage : le seuil rejoue à la prochaine visite */ }
    page.inert = false;
    $('#barre').inert = false;
    const seal = $('.seuil__sceau', seuil);
    const from = seal.getBoundingClientRect();
    const to = $('.marque svg').getBoundingClientRect();
    seuil.classList.add('is-passage');
    if (!reduceMotion.matches) {
      seal.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`;
      page.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 300, easing: 'cubic-bezier(0.22, 0.61, 0.21, 1)', fill: 'backwards' });
    }
    setTimeout(() => { seuil.hidden = true; page.focus({ preventScroll: true }); }, reduceMotion.matches ? 180 : 1050);
  }
  function resetSeuil() {
    seuil.hidden = false;
    seuil.classList.remove('is-passage', ...SEQUENCE_CLASSES);
    $('.seuil__sceau', seuil).style.transform = '';
    $$('.allumee, .chaud', seuil).forEach((node) => node.classList.remove('allumee', 'chaud'));
    page.inert = true;
    $('#barre').inert = true;
    seuil.focus({ preventScroll: true });
    requestAnimationFrame(() => requestAnimationFrame(playSeuil));
  }

  /* ------------------------------------------------------------------ Événements */

  document.addEventListener('click', (event) => {
    const target = event.target;
    const langButton = target.closest('[data-langue]');
    if (langButton) { clearTimeout(autoEnter); setMode(langButton.dataset.langue); return; }
    if (target.closest('#seuil')) {
      if (target.closest('#seuil-reponse, .seuil__sceau')) { seuil.classList.contains('is-pret') ? enter() : skipToReady(); }
      else skipToReady();
      return;
    }
    if (target.closest('[data-fermer]')) { target.closest('dialog').close(); return; }
    if (target.closest('#ouvrir-index')) { openIndex(); return; }
    if (target.closest('#ouvrir-recherche')) { openSearch(); return; }
    if (target.closest('#bascule-glose, #bascule-glose-index')) { state.gloss = !state.gloss; store.set('tc-glose', state.gloss ? '1' : '0'); renderChrome(); render({ transition: false }); if ($('#index').open) openIndex(); return; }
    if (target.closest('#rejouer-seuil')) { scrollTo(0, 0); resetSeuil(); return; }
    if (target.closest('#rejouer-courbes')) {
      $$('.courbe__mobile').forEach((mobile) => mobile.animate([{ transform: 'translateX(0) rotate(45deg)' }, { transform: `translateX(${mobile.parentElement.clientWidth - 9}px) rotate(45deg)` }], { duration: reduceMotion.matches ? 1 : 1200, easing: getComputedStyle(document.documentElement).getPropertyValue(`--ease-${mobile.dataset.courbe}`).trim(), fill: 'forwards' }));
      return;
    }
    if (target.closest('#mots-page')) {
      const ids = [...new Set($$('[data-lex]', page).map((node) => node.dataset.lex))];
      const dialog = $('#recherche');
      dialog.innerHTML = `<div class="feuillet__tete"><p class="inscription">${t('pageWords')}</p><button type="button" class="bouton bouton--petit" data-fermer>${rub('action.close')}</button></div><ul class="liste">${ids.map((id) => { const entry = lex.get(id); return `<li><b lang="art-x-valyrian">${esc(entry.hv)}</b> — ${esc(entry[R()])}<span class="sous">${esc(statusLabel(entry.status))}${entry.verifie_en_ligne ? '' : ` · ${t('toConfirm')}`}</span></li>`; }).join('')}</ul>`;
      dialog.showModal();
      return;
    }
    const reliability = target.closest('[data-fiabilite]');
    if (reliability) { state.filters.reliability = reliability.dataset.fiabilite; render({ transition: false }); return; }
    if (target.closest('[data-adaptation]')) { state.filters.adaptation = !state.filters.adaptation; render({ transition: false }); return; }
    const status = target.closest('[data-statut]');
    if (status) { state.lexStatus = status.dataset.statut; render({ transition: false }); return; }
    if (target.closest('dialog a[href^="#/"]')) { target.closest('dialog').close(); }
    const word = target.closest('[data-lex]');
    if (word && !target.closest('a, button, summary, dialog')) { openGloss(word); return; }
    if (!target.closest('#note-glose')) closeGloss();
    if (target.tagName === 'DIALOG') target.close();
  });

  document.addEventListener('input', (event) => {
    if (event.target.id === 'champ-recherche') {
      const results = search(event.target.value);
      $('#resultats-recherche').innerHTML = event.target.value.trim().length < 2 ? '' : results.length ? `<ul class="liste">${results.map((item) => `<li><a href="${item.href}">${esc(item.label())}</a><span class="sous">${esc(lex.get(item.kind)[R()])}</span></li>`).join('')}</ul>` : `<p class="vide">${t('noResult')}</p>`;
    }
    if (event.target.id === 'cherche-personne') {
      const needle = fold(event.target.value.trim());
      const box = $('#resultats-personne');
      const found = needle.length < 2 ? [] : D.genealogy.persons.filter((person) => fold(`${person.nameFr} ${person.nameEn} ${person.epithetFr ?? ''}`).includes(needle)).slice(0, 8);
      box.hidden = found.length === 0;
      box.innerHTML = found.map((person) => `<a href="#/lignee/${person.id}">${esc(personName(person))} <span class="noeud__dates">${esc(lifeDates(person))}</span></a>`).join('');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeGloss();
    // Au seuil : tout geste clavier saute à l'état prêt ; Entrée ou Espace sur le seuil lui-même vaut réponse.
    if (seuil && !seuil.hidden && !seuil.classList.contains('is-passage') && ['Enter', ' ', 'Escape'].includes(event.key)) {
      if (!seuil.classList.contains('is-pret')) { event.preventDefault(); skipToReady(); }
      else if (event.target === seuil && event.key !== 'Escape') { event.preventDefault(); enter(); }
    }
  });
  $('#seuil-langues').addEventListener('pointerenter', () => clearTimeout(autoEnter));
  $('#seuil-langues').addEventListener('focusin', () => clearTimeout(autoEnter));
  window.addEventListener('hashchange', () => { state.filters.reliability = ''; render(); });

  /* ------------------------------------------------------------------ Démarrage */

  renderChrome();
  render({ transition: false });
  let seen = false;
  try { seen = sessionStorage.getItem('tc-seuil') === '1'; } catch { /* ignoré */ }
  const deepLink = location.hash.replace(/^#\/?/, '') !== '';
  if (seen || deepLink) { seuil.hidden = true; } else { page.inert = true; $('#barre').inert = true; seuil.focus({ preventScroll: true }); requestAnimationFrame(() => requestAnimationFrame(playSeuil)); }
})();

/*
 * Copie adaptée de `Pal` de la V2 (src/versions/v2/pages/lignee/Pal.tsx), v3-spec §6.5 :
 * même pal, mêmes mesures, même déploiement, même correction StrictMode. Changements : la
 * couronne lisible (`Couronne`) remplace le petit rectangle (audit V2 n° 16), l'ordinal en
 * Grenze collé au nom disparaît (audit V2 n° 15), le nom du centre est un titre et non un
 * lien de cartel (« ouvrir la fiche » reste dessous).
 */
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavigationType, useNavigationType } from 'react-router-dom';
import type { MouseEvent, ReactNode } from 'react';

import type { Person } from '@/core/content/types';
import type { Kinship } from '@/core/genealogy';
import { formatSpan, useLang, useT, useTitle, useTx, VALYRIAN_TAG } from '@/core/i18n';
import { DURATION, EASE, Flip, gsap, prefersReducedMotion, useGSAP } from '@/core/motion';

import { Fiabilite } from '@/versions/v2/components/Fiabilite';
import { Lien } from '@/versions/v2/components/Lien';
import { isModifiedClick } from '@/versions/v2/components/numerals';
import { Anneau } from '@/versions/v2/pages/lignee/Anneau';
import { graph, sovereignById, threadRank } from '@/versions/v2/pages/lignee/donnees';
import type { Ligne, ModelePal, Rangee } from '@/versions/v2/pages/lignee/modelePal';
import styles from '@/versions/v2/pages/lignee/Pal.module.css';
import { nomCourt } from '@/versions/v2/pages/lignee/nomCourt';
import { mesurerPal, PAL } from '@/versions/v2/pages/lignee/tracePal';
import type { Trace } from '@/versions/v2/pages/lignee/tracePal';
import { useEtatAnnee } from '@/versions/v2/pages/lignee/useEtatAnnee';

import { Couronne } from './Couronne';
import p3 from './Pal3.module.css';

interface PalProps {
  modele: ModelePal;
  year: number | null;
  /** Personnes du chemin du lien de parenté : leur nom et leur entaille passent en braise. */
  chemin: ReadonlySet<string>;
  /** Adresse (sans préfixe) qui place une personne au centre. */
  recentre: (id: string) => string;
  /** À l'arrivée par un lien qui nomme la personne (`?p=`), amener le centre à l'écran. */
  revelerAuDebut: boolean;
}

interface Contexte {
  year: number | null;
  chemin: ReadonlySet<string>;
  fil: string | null;
  centre: string;
  recentre: (id: string) => string;
  avant: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Coefficient de consanguinité de Wright de la personne au centre. */
  inbreeding: number;
}

const UNION_WORD = { mariage: 'spouse', liaison: 'lover', fiancailles: 'betrothed' } as const;

/** Ce que le conjoint est pour la personne, par le sang puis par l'union : « oncle et époux ». */
function useParenteUnion(): (parente: Kinship | null, partner: Person | null, type: keyof typeof UNION_WORD | 'sans-union') => string | null {
  const t = useT();
  return useCallback(
    (parente, partner, type) => {
      if (!parente || !partner) return null;
      const kin = t(`page.lignee.${parente.key}`);
      if (type === 'sans-union') return kin;
      return t('v2.lineage.kin_and_union', { kin, union: t(`page.lignee.kin.${UNION_WORD[type]}.${partner.sex}`) });
    },
    [t],
  );
}

/** Un nom de la lignée : le toucher place la personne au centre (`?p=`). Couronne lisible pour un souverain, sans ordinal (audit V2 n° 15). */
function NomPal({ person, ctx, taille, children }: { person: Person; ctx: Contexte; taille: 'fil' | 'tete' | 'conjoint' | 'petit'; children?: ReactNode }) {
  const t = useT();
  const title = useTitle();
  const etat = useEtatAnnee()(person, ctx.year);
  const name = title(person.name);
  const court = name.isHv ? { nom: name.primary, precision: null } : nomCourt(person, name.primary);
  const sovereign = sovereignById.get(person.id);
  const isFil = person.id === ctx.fil;
  const parentage = taille === 'petit' ? graph.parentageByChild.get(person.id) : undefined;
  return (
    <span
      className={styles.nom}
      data-taille={taille}
      data-etat={etat.etat}
      data-flip-id={person.id}
      data-noeud={`p:${person.id}`}
      data-fil-nom={isFil ? '' : undefined}
      data-chemin={ctx.chemin.has(person.id) ? '' : undefined}
    >
      <Lien to={ctx.recentre(person.id)} className={styles.lien} onClick={ctx.avant}>
        {sovereign ? <Couronne className={`${styles.couronne} ${p3.couronne}`} title={t('label.reign')} /> : null}
        <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{court.nom}</span>
      </Lien>
      {court.precision && taille !== 'petit' ? <span className={styles.precision}>{court.precision}</span> : null}
      {parentage && parentage.certainty !== 'etabli' ? <Fiabilite level={parentage.certainty} compact className={styles.doute} /> : null}
      {taille === 'petit' ? null : <span className={styles.meta}>{etat.texte}</span>}
      {children}
    </span>
  );
}

function Numero({ id }: { id: string }) {
  const t = useT();
  const rank = threadRank.get(id);
  if (rank === undefined) return null;
  return (
    <span className={styles.numero}>
      <span aria-hidden="true">{rank + 1}</span>
      <span className="sr-only">{t('v2.lineage.generation', { n: rank + 1 })}</span>
    </span>
  );
}

function Centre({ person, ctx, inbreeding }: { person: Person; ctx: Contexte; inbreeding: number }) {
  const t = useT();
  const name = useTitle()(person.name);
  const tx = useTx();
  const { reading } = useLang();
  const etat = useEtatAnnee()(person, ctx.year);
  const sovereign = sovereignById.get(person.id);
  return (
    <div className={styles.centre}>
      <h2
        className={`${styles.centreNom} ${p3.centreNom}`}
        data-flip-id={person.id}
        data-noeud={`p:${person.id}`}
        data-fil-nom={person.id === ctx.fil ? '' : undefined}
        data-centre=""
        data-etat={etat.etat}
      >
        {sovereign ? <Couronne className={p3.couronneCentre} title={t('label.reign')} /> : null}
        <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
      </h2>
      {person.epithet ? <p className={styles.epithete}>{tx(person.epithet)}</p> : null}
      <p className={styles.centreMeta}>
        <span data-etat={etat.etat}>{etat.texte}</span>
        {sovereign ? <span>{t('page.person.reign', { span: formatSpan(sovereign.reignFrom, sovereign.reignTo, reading) })}</span> : null}
        {person.pretender && !sovereign ? (
          <span>{t('page.person.claim', { span: formatSpan(person.pretender.from, person.pretender.to, reading) })}</span>
        ) : null}
        {inbreeding >= 0.001 ? (
          <span>{t('v2.lineage.inbreeding', { value: inbreeding.toLocaleString(reading, { maximumFractionDigits: 3 }) })}</span>
        ) : null}
      </p>
      <p className={styles.centreLiens}>
        <Lien to={`/personnages/${person.id}`}>{t('v2.cartel.open_page')}</Lien>
      </p>
    </div>
  );
}

function LignePal({ ligne, rangee, ctx }: { ligne: Ligne; rangee: Rangee; ctx: Contexte }) {
  const t = useT();
  const title = useTitle();
  const parenteUnion = useParenteUnion();
  const porteFil = rangee.fil !== null && ligneHas(ligne, rangee.fil);
  let contenu: ReactNode;
  switch (ligne.kind) {
    case 'fil':
      contenu = (
        <NomPal person={ligne.person} ctx={ctx} taille="fil">
          {ligne.parente ? <span className={styles.parente}>{t(`page.lignee.${ligne.parente.key}`)}</span> : null}
        </NomPal>
      );
      break;
    case 'tete':
      contenu = <NomPal person={ligne.person} ctx={ctx} taille="tete" />;
      break;
    case 'conjoint': {
      const kin = parenteUnion(ligne.anneau.parente, ligne.person, ligne.anneau.type);
      contenu = (
        <span className={styles.union} data-union="">
          <Anneau anneau={ligne.anneau} />
          {ligne.person ? (
            <NomPal person={ligne.person} ctx={ctx} taille="conjoint">
              {kin ? <span className={styles.parente}>{kin}</span> : null}
            </NomPal>
          ) : (
            <span className={styles.inconnu}>{t('page.lignee.panel.unknownPartner')}</span>
          )}
        </span>
      );
      break;
    }
    case 'centre':
      contenu = <Centre person={ligne.person} ctx={ctx} inbreeding={ctx.inbreeding} />;
      break;
    case 'fratrie':
      contenu = (
        <span className={styles.groupe}>
          {ligne.pleine.length > 0 ? (
            <span className={styles.sousGroupe}>
              <span className={styles.etiquette}>{t('page.person.kin.siblings')}</span>
              <Noms persons={ligne.pleine} ctx={ctx} />
            </span>
          ) : null}
          {ligne.demi.length > 0 ? (
            <span className={styles.sousGroupe}>
              <span className={styles.etiquette}>{t('v2.lineage.half_siblings')}</span>
              <Noms persons={ligne.demi} ctx={ctx} />
            </span>
          ) : null}
        </span>
      );
      break;
    case 'enfants':
      contenu = (
        <span className={styles.groupe} data-noeud={ligne.key}>
          <span className={styles.etiquette}>
            {ligne.partner ? t('v2.lineage.children_with', { name: nomCourt(ligne.partner, title(ligne.partner.name).primary).nom }) : t('v2.lineage.children_unknown')}
          </span>
          <Noms persons={ligne.enfants} ctx={ctx} />
        </span>
      );
      break;
  }
  return (
    <div className={styles.ligne} data-kind={ligne.kind} data-fil={porteFil ? '' : undefined}>
      <span className={styles.marge}>{porteFil && rangee.fil ? <Numero id={rangee.fil} /> : null}</span>
      <div className={styles.contenu} data-contenu="">
        {contenu}
      </div>
    </div>
  );
}

function Noms({ persons, ctx }: { persons: readonly Person[]; ctx: Contexte }) {
  return (
    <span className={styles.noms}>
      {persons.map((person, index) => (
        <Fragment key={person.id}>
          <span className={styles.nomListe}>
            <NomPal person={person} ctx={ctx} taille="petit" />
            {index < persons.length - 1 ? <span aria-hidden="true">,</span> : null}
          </span>
          {index < persons.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}

function ligneHas(ligne: Ligne, id: string): boolean {
  switch (ligne.kind) {
    case 'fratrie':
      return [...ligne.pleine, ...ligne.demi].some((person) => person.id === id);
    case 'enfants':
      return ligne.enfants.some((person) => person.id === id);
    case 'conjoint':
      return ligne.person?.id === id;
    default:
      return ligne.person.id === id;
  }
}

/**
 * Le pal (spec §5.7) : une bande de sang de 12 px qui descend toute la page, le fil de
 * filiation (une personne par génération, entaillée sur le pal), et le bloc de la personne
 * au centre. Le texte est une liste ordinaire, lisible sans le dessin ; le dessin
 * (`aria-hidden`) est mesuré sur ce texte.
 *
 * Mouvement 5 : au changement de centre, la personne touchée monte au centre (`Flip`), le pal
 * se retrace du haut vers le bas, les fils du bloc se tracent, les anneaux du sang se ferment
 * en dernier. En mouvement réduit, la nouvelle disposition, tout tracé.
 */
export function Pal3({ modele, year, chemin, recentre, revelerAuDebut }: PalProps) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [version, setVersion] = useState(0);
  const deployed = useRef<string | null>(null);
  const [deploy, setDeploy] = useState<string | null>(null);

  const avant = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (isModifiedClick(event) || !root.current || prefersReducedMotion()) return;
    flipState.current = Flip.getState(root.current.querySelectorAll('[data-flip-id]'));
  }, []);

  // Mesure après chaque rendu qui change le texte, et à chaque changement de taille ou de police.
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    setTrace(mesurerPal(node, modele.descentes));
    if (deployed.current !== modele.centre.id) {
      deployed.current = modele.centre.id;
      setDeploy(modele.centre.id);
    }
  }, [modele, year, chemin, version]);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    let width = node.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const next = node.getBoundingClientRect().width;
      if (Math.abs(next - width) < 1) return;
      width = next;
      setVersion((value) => value + 1);
    });
    observer.observe(node);
    let alive = true;
    void document.fonts?.ready.then(() => {
      if (alive) setVersion((value) => value + 1);
    });
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      if (!deploy || !root.current || prefersReducedMotion()) {
        flipState.current = null;
        return;
      }
      const scope = root.current;
      const state = flipState.current;
      flipState.current = null;
      const timeline = gsap.timeline({ defaults: { ease: EASE.expo } });
      if (state) {
        timeline.add(
          Flip.from(state, {
            targets: scope.querySelectorAll('[data-flip-id]'),
            duration: 0.4,
            ease: EASE.expo,
            onEnter: (elements) => gsap.fromTo(elements, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: EASE.expo }),
          }),
          0,
        );
      }
      timeline.fromTo(
        scope.querySelectorAll('[data-trace-pal]'),
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.5 },
        0,
      );
      const fils = scope.querySelectorAll('[data-trace-fil]');
      if (fils.length > 0) timeline.fromTo(fils, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, stagger: 0.04 }, state ? 0.3 : 0.15);
      const boucles = scope.querySelectorAll('[data-sang] [data-boucle]');
      if (boucles.length > 0) timeline.fromTo(boucles, { drawSVG: '0%' }, { drawSVG: '100%', duration: DURATION.gesteLong }, '>-0.05');
    },
    { scope: root, dependencies: [deploy] },
  );

  // Le centre doit être à l'écran : après un changement de centre, et à l'arrivée par un lien
  // qui le nomme. Jamais au Retour (le gestionnaire de défilement rend la position du lecteur).
  const navigationType = useNavigationType();
  // Le centre déjà traité : en développement, StrictMode rejoue l'effet avec le même centre,
  // et ce second passage doit rester « l'arrivée », pas un changement de centre.
  const centreVu = useRef<string | null>(null);
  useEffect(() => {
    const initial = centreVu.current === null || centreVu.current === modele.centre.id;
    centreVu.current = modele.centre.id;
    if (initial && (!revelerAuDebut || navigationType === NavigationType.Pop)) return;
    // Après le retour en haut de page du gestionnaire de défilement et la mise en page des noms.
    const timer = window.setTimeout(() => {
      const element = root.current?.querySelector('[data-centre]');
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const bottomLimit = window.innerHeight - 140;
      if (rect.top >= 24 && rect.bottom <= bottomLimit) return;
      const behavior = initial || prefersReducedMotion() ? 'instant' : 'smooth';
      window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight * 0.28, behavior });
    }, initial ? 120 : 30);
    return () => window.clearTimeout(timer);
    // Le centre seul décide : l'année ou la largeur ne déplacent pas la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modele.centre.id]);

  const ctx: Contexte = {
    year,
    chemin,
    fil: null,
    centre: modele.centre.id,
    recentre,
    avant,
    inbreeding: modele.vue.inbreeding,
  };

  return (
    <div ref={root} className={styles.pal}>
      <span className={styles.rail} data-rail="" aria-hidden="true" />
      {trace ? (
        <svg className={styles.trace} width={trace.width} height={trace.height} aria-hidden="true" focusable="false">
          <g data-trace-pal="">
            <path
              className={styles.bande}
              d={`M${trace.pal.x - PAL / 2} ${trace.pal.top}H${trace.pal.x + PAL / 2}V${trace.pal.bottom}L${trace.pal.x} ${trace.pal.bottom + 14}L${trace.pal.x - PAL / 2} ${trace.pal.bottom}Z`}
            />
            {trace.entailles.map((entaille) => (
              <rect
                key={entaille.y}
                className={entaille.braise ? styles.entailleBraise : styles.entaille}
                x={trace.pal.x - PAL / 2}
                y={entaille.y - 1.5}
                width={PAL}
                height={3}
              />
            ))}
          </g>
          {trace.fils.map((fil) => (
            <path key={fil.key} className={styles.filiation} data-doute={fil.doute ? '' : undefined} data-trace-fil="" d={fil.d} />
          ))}
          {trace.traits.map((trait) => (
            <line key={trait.y} className={styles.trait} x1={trait.x1} x2={trait.x2} y1={trait.y} y2={trait.y} />
          ))}
        </svg>
      ) : null}
      <ol className={styles.rangees} aria-label={t('page.lignee.thread.label')}>
        {modele.rangees.map((rangee) => (
          <li key={rangee.generation} className={`${styles.rangee} ${p3.rangee}`} data-rangee="" data-bloc={rangee.bloc ? '' : undefined}>
            {rangee.lignes.map((ligne) => (
              <LignePal key={ligne.key} ligne={ligne} rangee={rangee} ctx={{ ...ctx, fil: rangee.fil }} />
            ))}
          </li>
        ))}
      </ol>
    </div>
  );
}

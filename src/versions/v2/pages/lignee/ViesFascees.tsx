import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import type { Person } from '@/core/content/types';
import type { LifeSpan, TimeScale } from '@/core/timeline';
import { yearToX } from '@/core/timeline';
import { Gloss, useLang, useT, useTx } from '@/core/i18n';

import { fasceScale, useFasceGeometry } from '../../components/fasce/geometry';
import { NomEntite } from '../../components/NomEntite';
import { toRoman } from '../../components/numerals';
import { useFasce } from '../../state/fasce';

import { graph, sovereignById } from './donnees';
import type { GroupeVies } from './groupesVies';
import { nomCourt } from './nomCourt';
import { useTelephone } from './useEcran';
import { useEtatAnnee } from './useEtatAnnee';
import styles from './ViesFascees.module.css';

interface ViesFasceesProps {
  groupes: readonly GroupeVies[];
  year: number | null;
}

/** Bord gauche d'un élément dans la fenêtre, tenu à jour au redimensionnement. */
function useLeft<T extends HTMLElement>(): [RefObject<T | null>, number, number] {
  const ref = useRef<T>(null);
  const [box, setBox] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setBox((previous) => (Math.abs(previous.left - rect.left) < 0.5 && Math.abs(previous.width - rect.width) < 0.5 ? previous : { left: rect.left, width: rect.width }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return [ref, box.left, box.width];
}

interface Survol {
  span: readonly [number, number];
  reign: readonly [number, number] | null;
}

/** Une vie sur l'échelle de la fasce : trait plein pour le sûr, pointillé pour l'ouvert, or pour le règne. */
function Trace({ span, scale, offset, person }: { span: LifeSpan; scale: TimeScale; offset: number; person: Person | undefined }) {
  const x = (year: number) => offset + yearToX(scale, year);
  const y = 12;
  const [a, b] = span.extent;
  const claim = person?.pretender && !sovereignById.has(span.id) ? person.pretender : null;
  return (
    <>
      <line className={styles.ouvert} x1={x(a)} x2={Math.max(x(b), x(a) + 2)} y1={y} y2={y} />
      {span.sure ? (
        span.sure[1] > span.sure[0] ? (
          <line className={styles.sur} x1={x(span.sure[0])} x2={x(span.sure[1])} y1={y} y2={y} />
        ) : (
          <rect className={styles.point} x={x(span.sure[0]) - 1.5} y={y - 5} width={3} height={10} />
        )
      ) : null}
      {span.reign ? (
        <rect className={styles.regne} x={x(span.reign[0])} y={y - 4} width={Math.max(3, x(span.reign[1]) - x(span.reign[0]))} height={8} />
      ) : null}
      {claim ? (
        <rect
          className={styles.pretention}
          x={x(claim.from)}
          y={y - 3.5}
          width={Math.max(3, x(claim.to ?? 300) - x(claim.from))}
          height={7}
        />
      ) : null}
    </>
  );
}

function Rangee({ span, scale, offset, width, year, onSurvol }: { span: LifeSpan; scale: TimeScale | null; offset: number; width: number; year: number | null; onSurvol: (survol: Survol | null) => void }) {
  const tx = useTx();
  const { reading } = useLang();
  const phone = useTelephone();
  const etatAnnee = useEtatAnnee();
  const person = graph.personById.get(span.id);
  if (!person) return null;
  const etat = etatAnnee(person, null);
  // Le nom sans la Maison ni la précision d'homonymie, qui passe en petit sous le nom.
  const fr = nomCourt(person, person.name.fr);
  const en = nomCourt(person, person.name.en);
  const court = { fr: fr.nom, en: en.nom };
  const precision = (reading === 'fr' ? fr : en).precision;
  const atYear = year === null ? null : etatAnnee(person, year).etat;
  // Une vie qui tombe sous la colonne des noms (l'approche, avant la Conquête) porte son nom au bout de son trait.
  const end = scale ? offset + yearToX(scale, span.extent[1]) : 0;
  const start = scale ? offset + yearToX(scale, span.extent[0]) : 0;
  const reserve = width * 0.25;
  const after = !phone && scale !== null && start < reserve && end + 16 + 220 < width;
  const survol = (active: boolean) =>
    onSurvol(active ? { span: [span.extent[0], span.extent[1]], reign: span.reign ? [span.reign[0], span.reign[1]] : null } : null);
  return (
    <li className={styles.rangee} data-annee={atYear ?? undefined} data-apres={after ? '' : undefined}>
      {scale ? (
        <svg className={styles.vie} aria-hidden="true" focusable="false" width={Math.max(1, width)} height={24} viewBox={`0 0 ${Math.max(1, width)} 24`}>
          <Trace span={span} scale={scale} offset={offset} person={person} />
        </svg>
      ) : null}
      <div className={styles.nom} style={after ? { left: `${end + 16}px` } : undefined}>
        <NomEntite kind="person" id={person.id} name={court} onActive={survol} />
        <span className={styles.annees}>
          {precision ? <span className={styles.epithete}>{precision}</span> : null}
          {person.epithet ? <span className={styles.epithete}>{tx(person.epithet)}</span> : null}
          {etat.texte}
        </span>
      </div>
    </li>
  );
}

/**
 * La figure fascée des personnages (spec §5.8) : une rangée par personne, sa vie tracée à
 * l'échelle exacte de la fasce et alignée au pixel sur elle ; l'année réglée la traverse d'une
 * entaille d'obsidienne, qui montre d'un regard qui vit cette année-là. Survoler un nom pose
 * sa vie sur la fasce.
 */
export function ViesFascees({ groupes, year }: ViesFasceesProps) {
  const t = useT();
  const { reading } = useLang();
  const geometry = useFasceGeometry();
  const [ref, left, width] = useLeft<HTMLDivElement>();
  const [survol, setSurvol] = useState<Survol | null>(null);
  useFasce({ span: survol?.span ?? null, reign: survol?.reign ?? null }, 'transient');

  const scale = geometry ? fasceScale(geometry.width) : null;
  const offset = geometry ? geometry.left - left : 0;
  const cut = scale && year !== null ? offset + yearToX(scale, year) : null;

  return (
    <div ref={ref} className={styles.figure} aria-label={t('v2.people.figure')} role="group">
      {groupes.map((groupe) => (
        <section key={groupe.key} id={`g-${groupe.key}`} className={styles.groupe}>
          <h2 className={styles.titre}>
            <span className={styles.chiffre}>{toRoman(groupe.period.order)}</span>
            <span className={styles.titreTexte}>
              <Gloss text={groupe.period.title} classes={{ tr: styles.glose }} />
              {groupe.reigns.length > 0 ? (
                <span className={styles.sous}>
                  {t('v2.people.under', { name: groupe.reigns.map((sovereign) => sovereign.name[reading].replace(/\s+Targaryen$/, '')).join(', ') })}
                </span>
              ) : null}
            </span>
          </h2>
          <ol className={styles.liste} role="list">
            {groupe.spans.map((span) => (
              <Rangee key={span.id} span={span} scale={scale} offset={offset} width={width} year={year} onSurvol={setSurvol} />
            ))}
          </ol>
        </section>
      ))}
      {cut !== null ? <span className={styles.coupe} style={{ left: `${cut - 1}px` }} aria-hidden="true" /> : null}
    </div>
  );
}

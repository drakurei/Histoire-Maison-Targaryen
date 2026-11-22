import { useId, useMemo, useRef } from 'react';

import type { Person } from '@/core/content/types';
import { kinship, kinshipCoefficient } from '@/core/genealogy';
import { formatSpan, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { gsap, prefersReducedMotion, useGSAP } from '@/core/motion';

import { Lien } from '../../components/Lien';

import { graph, lifeBounds, personsByGeneration } from './donnees';
import styles from './LienParente.module.css';

interface LienParenteProps {
  a: string;
  b: string | null;
  onA: (id: string) => void;
  onB: (id: string | null) => void;
  recentre: (id: string) => string;
}

const UNION_WORD = { spouse: 'spouse', lover: 'lover', betrothed: 'betrothed' } as const;

function Choix({ label, value, onChange, empty }: { label: string; value: string; onChange: (id: string) => void; empty?: string }) {
  const id = useId();
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const option = (person: Person) => {
    const { born, died } = lifeBounds(person);
    const span = born === null && died === null ? '' : ` (${formatSpan(born, died, reading)})`;
    return `${title(person.name).primary}${span}`;
  };
  return (
    <div className={styles.choix}>
      <label htmlFor={id} className={styles.etiquette}>
        {label}
      </label>
      <select id={id} className={styles.select} value={value} onChange={(event) => onChange(event.target.value)}>
        {empty !== undefined ? <option value="">{empty}</option> : null}
        {[...personsByGeneration].map(([generation, list]) => (
          <optgroup key={generation} label={t('page.people.generation', { n: generation + 1 })}>
            {list.map((person) => (
              <option key={person.id} value={person.id}>
                {option(person)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

/**
 * Le lien de parenté (spec §5.7) : deux personnes (`?p=` et `?avec=`), la parenté en toutes
 * lettres, union comprise (« oncle et époux »), et le chemin du sang tracé en braise : il
 * monte de la première personne jusqu'à l'ancêtre commun, puis descend vers la seconde,
 * 90 ms par génération.
 */
export function LienParente({ a, b, onA, onB, recentre }: LienParenteProps) {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const figure = useRef<HTMLDivElement>(null);
  const link = useMemo(() => (b && b !== a ? kinship(graph, a, b) : null), [a, b]);
  const personA = graph.personById.get(a);
  const personB = b ? graph.personById.get(b) : undefined;

  let words: string | null = null;
  if (link && personB) {
    const union = link.unionRelation ? t(`page.lignee.kin.${UNION_WORD[link.unionRelation]}.${personB.sex}`) : null;
    if (link.relation === 'none') words = union ?? t('page.lignee.kin.none');
    else words = union ? t('v2.lineage.kin_and_union', { kin: t(`page.lignee.${link.key}`), union }) : t(`page.lignee.${link.key}`);
  } else if (b && b === a) {
    words = t('page.lignee.kin.self');
  }

  const line = link?.line ?? [];
  const up = link?.up ?? 0;
  const down = link?.down ?? 0;
  const rows = line.length > 0 ? Math.max(up, down) + 1 : 0;
  const apex = line[up];
  const left = line.slice(0, up).reverse();
  const right = line.slice(up + 1);
  const coefficient = link && link.relation !== 'none' && b ? kinshipCoefficient(graph, a, b) : 0;

  useGSAP(
    () => {
      const path = figure.current?.querySelector('[data-chemin-trace]');
      if (!path || prefersReducedMotion()) return;
      gsap.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.09 * Math.max(1, up + down), ease: 'none' });
    },
    { scope: figure, dependencies: [a, b] },
  );

  const name = (id: string | undefined) => {
    const person = id ? graph.personById.get(id) : undefined;
    if (!person) return null;
    const text = title(person.name);
    return (
      <Lien to={recentre(person.id)} className={styles.nom}>
        <span lang={text.isHv ? VALYRIAN_TAG : undefined}>{text.primary}</span>
      </Lien>
    );
  };

  // Le chemin : de la première personne (en bas à gauche) jusqu'à l'ancêtre (en haut), puis la seconde.
  const rowY = (row: number) => ((row + 0.5) / Math.max(1, rows)) * 100;
  const xLeft = 2;
  const xRight = up > 0 && down > 0 ? 52 : 2;
  // La barre passe sous l'ancêtre commun, au bord haut de la deuxième rangée.
  const yBar = (1 / Math.max(1, rows)) * 100 - 2;
  const both = up > 0 && down > 0;
  let d = '';
  if (rows > 1 && up > 0) d = `M${xLeft} ${rowY(up)}V${yBar}${both ? `H${xRight}V${rowY(down)}` : ''}`;
  else if (rows > 1) d = `M${xRight} ${yBar}V${rowY(down)}`;

  return (
    <section className={styles.lien} aria-labelledby={`${a}-lien`}>
      <h2 id={`${a}-lien`} className={styles.titre}>
        {t('v2.lineage.link')}
      </h2>
      <div className={styles.choixDeux}>
        <Choix label={t('v2.lineage.first')} value={a} onChange={onA} />
        <Choix label={t('v2.lineage.second')} value={b ?? ''} onChange={(id) => onB(id || null)} empty={t('v2.lineage.choose')} />
      </div>
      {b ? (
        <button type="button" className={styles.inverser} onClick={() => (b ? (onA(b), onB(a)) : undefined)}>
          {t('v2.lineage.swap')}
        </button>
      ) : null}

      <div aria-live="polite" className={styles.resultat}>
        {words && personA && personB ? (
          <>
            <p className={styles.parente}>{words}</p>
            <p className={styles.pour}>
              {t('v2.lineage.link_for', { b: title(personB.name).primary, a: title(personA.name).primary })}
            </p>
            {link && link.apexes.length > 0 ? (
              <p className={styles.detail}>
                {t(link.apexes.length > 1 ? 'v2.lineage.apexes' : 'v2.lineage.apex', {
                  names: link.apexes
                    .map((id) => graph.personById.get(id))
                    .filter((person): person is Person => person !== undefined)
                    .map((person) => title(person.name).primary)
                    .join(` ${t('page.lignee.and')} `),
                })}
                {link.degree !== null ? <span>{t('v2.lineage.degree', { n: link.degree })}</span> : null}
                {coefficient > 0 ? (
                  <span>{t('page.lignee.coefficient', { value: coefficient.toLocaleString(reading, { maximumFractionDigits: 3 }) })}</span>
                ) : null}
              </p>
            ) : null}
          </>
        ) : (
          <p className={styles.vide}>{t('v2.lineage.link_empty')}</p>
        )}
      </div>

      {rows > 1 ? (
        <div ref={figure} className={styles.chemin} style={{ ['--rangs' as string]: rows }}>
          <svg className={styles.trace} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path data-chemin-trace="" d={d} vectorEffect="non-scaling-stroke" />
          </svg>
          <ol className={styles.colonnes} role="list">
            <li className={styles.apex} style={{ gridRow: 1, gridColumn: up > 0 && down > 0 ? '1 / -1' : '1' }}>
              {name(apex)}
            </li>
            {left.map((id, index) => (
              <li key={`l-${id}`} className={styles.maillon} style={{ gridRow: index + 2, gridColumn: 1 }}>
                {name(id)}
              </li>
            ))}
            {right.map((id, index) => (
              <li key={`r-${id}`} className={styles.maillon} style={{ gridRow: index + 2, gridColumn: up > 0 ? 2 : 1 }}>
                {name(id)}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

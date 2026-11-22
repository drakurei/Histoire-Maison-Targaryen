import { useMemo } from 'react';

import { dragons as REGISTRY, getDragon } from '@/core/content/dragons';
import type { Dragon } from '@/core/content/types';
import { layoutDragonScale } from '@/core/dragons/scale';
import { formatYear, useLang, useT, useTx } from '@/core/i18n';
import { DragonFigure, DragonScale } from '@/shared/dragon';

import { GrandNombre } from '../../components/GrandNombre';
import { NomEntite } from '../../components/NomEntite';
import { useElementWidth } from '../../components/useElementWidth';
import { Vide } from '../../components/Vide';
import { presenceAt } from '../../model/presence';
import { presence } from '../../state/scene';
import { useSetYear, useYear } from '../../state/year';

import { EXTINCTION, FIRST_DRAGON_YEAR, RETURN_YEAR } from './dragonLife';
import styles from './QuiVole.module.css';

/** Unités de l'échelle pour l'envergure de Balerion (`SCALE_UNIT` du cœur). */
const UNIT = 1000;
const GAP = 0.03;
/** Place du repère humain au bout d'une ligne, en unités : une hauteur et demie d'homme, plus son corps. */
const HUMAN_ROOM = 50;

interface Line {
  dragons: Dragon[];
  /** Numéro du premier dragon de la ligne dans la suite. */
  start: number;
}

/** Pixels pour une envergure de Balerion : la figure tient en peu de lignes, et Balerion n'y dépasse jamais un tiers de la largeur. */
function unitPixels(width: number, totalSpan: number, phone: boolean): number {
  const share = phone ? 0.6 : 0.36;
  const maxLines = phone ? 5 : 3;
  return Math.max(24, Math.min(width * share, (maxLines * width) / (totalSpan * (1 + GAP) + 0.2)));
}

/** Range les dragons, du plus grand au plus petit, en lignes qui tiennent dans la largeur. */
function packLines(sorted: readonly Dragon[], width: number, k: number): Line[] {
  const lines: Line[] = [];
  let current: Dragon[] = [];
  let used = HUMAN_ROOM;
  let index = 0;
  for (const dragon of sorted) {
    const need = dragon.look.span * UNIT + (current.length > 0 ? GAP * UNIT : 0);
    if (current.length > 0 && ((used + need) * k) / UNIT > width) {
      lines.push({ dragons: current, start: index - current.length });
      current = [];
      used = HUMAN_ROOM;
    }
    current.push(dragon);
    used += dragon.look.span * UNIT + (current.length > 1 ? GAP * UNIT : 0);
    index += 1;
  }
  if (current.length > 0) lines.push({ dragons: current, start: index - current.length });
  return lines;
}

function ScaleLine({ line, k }: { line: Line; k: number }) {
  const t = useT();
  const tx = useTx();
  const entries = useMemo(() => line.dragons.map((dragon) => ({ id: dragon.id, look: dragon.look, title: tx(dragon.name) })), [line, tx]);
  const layout = useMemo(() => layoutDragonScale(entries, { order: 'given', gap: GAP }), [entries]);
  const width = (layout.width * k) / UNIT;
  return (
    <div className={styles.ligne} style={{ width: `${width}px` }}>
      <DragonScale
        dragons={entries}
        title={t('page.dragons.scale.title')}
        humanTitle={t('page.dragons.scale.human')}
        order="given"
        gap={GAP}
        tone="specimen"
        ground="dark"
        unattested="bare"
        detail="plain"
        className={styles.echelle}
      />
      <ol className={styles.numeros} aria-hidden="true" start={line.start + 1}>
        {layout.items.map((item, index) => (
          <li key={item.id} style={{ left: `${(item.centerX / layout.width) * 100}%` }}>
            {line.start + index + 1}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * « Qui vole en 129 » (spec §5.10) : les dragons vivants attestés à l'année réglée, à la même
 * échelle, du plus grand au plus petit, un homme debout pour repère, numérotés vers la
 * légende ; tous les dragons si aucune année n'est réglée. À part, ceux dont le sort est
 * inconnu. Une année sans dragon dit pourquoi et propose de tout revoir.
 */
export function QuiVole() {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const year = useYear();
  const setYear = useSetYear();
  const [ref, width] = useElementWidth<HTMLDivElement>();

  const entry = year !== null ? presenceAt(presence, year) : undefined;
  const shown = useMemo(() => {
    const list =
      year === null
        ? [...REGISTRY]
        : (entry?.attested ?? []).map((id) => getDragon(id)).filter((dragon): dragon is Dragon => dragon !== undefined);
    return list.sort((a, b) => b.look.span - a.look.span);
  }, [year, entry]);
  const doubtful = useMemo(
    () => (entry?.doubtful ?? []).map((id) => getDragon(id)).filter((dragon): dragon is Dragon => dragon !== undefined),
    [entry],
  );

  const phone = width > 0 && width < 640;
  const totalSpan = shown.reduce((sum, dragon) => sum + dragon.look.span, 0);
  const k = width > 0 ? unitPixels(width, totalSpan, phone) : 0;
  const lines = useMemo(() => (k > 0 ? packLines(shown, width, k) : []), [shown, width, k]);
  const number = new Intl.NumberFormat(reading, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const when = year !== null ? formatYear(year, reading) : '';

  const lastBefore = useMemo(() => {
    if (year === null) return undefined;
    return REGISTRY.filter((dragon) => dragon.died !== null && dragon.died < year).sort((a, b) => (b.died ?? 0) - (a.died ?? 0))[0];
  }, [year]);
  let emptyReason = '';
  if (year !== null && shown.length === 0) {
    if (FIRST_DRAGON_YEAR !== null && year < FIRST_DRAGON_YEAR) {
      emptyReason = t('v2.dragons.none_before', { first: formatYear(FIRST_DRAGON_YEAR, reading) });
    } else if (EXTINCTION !== null && year > EXTINCTION && RETURN_YEAR !== null) {
      emptyReason = t('v2.dragons.none_gap', { last: formatYear(EXTINCTION, reading), next: formatYear(RETURN_YEAR, reading) });
    }
  }

  return (
    <section className={styles.section} aria-labelledby="qui-vole">
      <div className={styles.tete}>
        {shown.length > 0 ? <GrandNombre value={String(shown.length)} className={styles.nombre} /> : null}
        <div className={styles.titres}>
          <h2 id="qui-vole" className={styles.titre}>
            {year === null ? t('v2.dragons.flying_all') : t('v2.dragons.flying', { year: when })}
          </h2>
          {shown.length > 0 ? (
            <p className={styles.compte}>
              {year === null
                ? t('v2.dragons.all_count', { n: shown.length })
                : shown.length === 1
                  ? t('v2.dragons.attested.one')
                  : t('v2.dragons.attested.many', { n: shown.length })}
            </p>
          ) : null}
        </div>
      </div>

      <div ref={ref} className={styles.figure}>
        {shown.length === 0 && year !== null ? (
          <Vide
            action={
              <button type="button" className={styles.action} onClick={() => setYear(null)}>
                {t('v2.dragons.show_all')}
              </button>
            }
          >
            {t('v2.dragons.none', { year: when })} {emptyReason}
          </Vide>
        ) : null}
        {shown.length === 0 && year !== null && lastBefore ? (
          <figure className={styles.dernier}>
            <div className={styles.dernierFigure} aria-hidden="true">
              <DragonFigure look={lastBefore.look} title={tx(lastBefore.name)} tone="engraving" ground="dark" detail="plain" />
            </div>
            <figcaption className={styles.note}>
              {t('v2.dragons.last_before', { died: formatYear(lastBefore.died, reading), name: tx(lastBefore.name) })}
            </figcaption>
          </figure>
        ) : null}
        {shown.length > 0 ? (
          <>
            <div className={styles.lignes} aria-hidden="true">
              {lines.map((line) => (
                <ScaleLine key={line.dragons[0]?.id ?? line.start} line={line} k={k} />
              ))}
            </div>
            {k > 0 ? (
              <div className={styles.regle} aria-hidden="true">
                <svg width={k} height={14} viewBox={`0 0 ${k} 14`} className={styles.regleTrait}>
                  <rect x={0} y={6} width={k} height={1.5} />
                  {Array.from({ length: 11 }, (_, index) => (
                    <rect key={index} x={Math.min(k - 1.5, (k * index) / 10)} y={index % 5 === 0 ? 0 : 3} width={1.5} height={index % 5 === 0 ? 14 : 8} />
                  ))}
                </svg>
                <span className={styles.regleNom}>{t('v2.dragons.ruler')}</span>
              </div>
            ) : null}
            <p className={styles.note}>{t('v2.dragons.scale_note')}</p>
            <ol className={styles.legende} aria-label={t('v2.dragons.legend_label')}>
              {shown.map((dragon) => (
                <li key={dragon.id}>
                  <NomEntite kind="dragon" id={dragon.id} name={dragon.name} />
                  <span className={styles.envergure}>
                    {dragon.look.attested.size
                      ? number.format(dragon.look.span)
                      : t('v2.dragons.span_estimated', { value: number.format(dragon.look.span) })}
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : null}
        {doubtful.length > 0 ? (
          <p className={styles.doute}>
            <span>{t('v2.state.unknown_fate')}</span>{' '}
            {doubtful.map((dragon, index) => (
              <span key={dragon.id}>
                {index > 0 ? ', ' : null}
                <NomEntite kind="dragon" id={dragon.id} name={dragon.name} />
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </section>
  );
}

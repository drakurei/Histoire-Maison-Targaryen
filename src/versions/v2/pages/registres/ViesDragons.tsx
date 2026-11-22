import { useId, useMemo, useState } from 'react';

import type { Dragon, DragonRider } from '@/core/content/types';
import { formatSpan, formatYear, Gloss, useLang, useT, useTx } from '@/core/i18n';
import { DragonFigure } from '@/shared/dragon';

import { NomEntite } from '../../components/NomEntite';
import { toRoman } from '../../components/numerals';
import { useFasce } from '../../state/fasce';
import { useYear } from '../../state/year';

import { useAxe } from './axe';
import type { Axe } from './axe';
import { dragonEpochs, lifeOf } from './dragonLife';
import type { DragonLife } from './dragonLife';
import styles from './ViesDragons.module.css';

const TRACK = 16;
const BAR_TOP = 5;
const BAR = 9;

interface Segment {
  from: number;
  to: number;
  /** Une borne manque : le segment est déduit de la vie, il se trace en pointillé. */
  inferred: boolean;
}

function riderSegments(riders: readonly DragonRider[], life: DragonLife): Segment[] {
  return riders.flatMap((rider) => {
    if (rider.from === undefined && rider.to === undefined) return [];
    const from = Math.max(life.from, rider.from ?? life.from);
    const to = Math.min(life.to, rider.to ?? life.sureTo);
    if (to < from) return [];
    return [{ from, to, inferred: rider.from === undefined || rider.to === undefined }];
  });
}

function Track({ dragon, life, axe, year, hatch }: { dragon: Dragon; life: DragonLife; axe: Axe<HTMLDivElement>; year: number | null; hatch: string }) {
  const [x0] = axe.edges(life.from);
  const [, sureEnd] = axe.edges(life.sureTo);
  const doubt = life.doubt ? [axe.edges(life.doubt[0])[0], axe.edges(life.doubt[1])[1]] : null;
  const segments = riderSegments(dragon.riders, life);
  const notch = year !== null && year >= life.from && year <= life.to ? axe.edges(year) : null;
  return (
    <svg className={styles.piste} width={axe.width} height={TRACK} viewBox={`0 0 ${axe.width} ${TRACK}`} aria-hidden="true" focusable="false">
      <rect className={styles.vie} x={x0} y={BAR_TOP} width={Math.max(1.5, sureEnd - x0)} height={BAR} />
      {doubt ? <rect x={doubt[0]} y={BAR_TOP} width={Math.max(1.5, (doubt[1] ?? 0) - (doubt[0] ?? 0))} height={BAR} fill={`url(#${hatch})`} /> : null}
      {segments.map((segment, index) => {
        const [a] = axe.edges(segment.from);
        const [, b] = axe.edges(segment.to);
        return (
          <line
            key={index}
            className={styles.cavalier}
            x1={a + 0.5}
            x2={Math.max(a + 1.5, b - 1)}
            y1={1.5}
            y2={1.5}
            data-deduit={segment.inferred ? '' : undefined}
          />
        );
      })}
      {notch ? <rect className={styles.entaille} x={(notch[0] + notch[1]) / 2 - 1.5} y={0} width={3} height={TRACK} /> : null}
    </svg>
  );
}

/** Largeur du spécimen à côté de la légende, en pixels : à l'échelle de l'envergure. */
export function specimenWidth(span: number): number {
  return Math.round(22 + span * 66);
}

function Silhouette({ dragon, name, left }: { dragon: Dragon; name: string; left: number | null }) {
  return (
    <div
      className={styles.silhouette}
      style={{ ['--envergure' as string]: String(dragon.look.span), ['--sx' as string]: left === null ? undefined : `${left}px`, ['--sw' as string]: `${specimenWidth(dragon.look.span)}px` }}
      data-place={left === null ? undefined : ''}
      aria-hidden="true"
    >
      <DragonFigure look={dragon.look} title={name} tone="specimen" ground="dark" detail="plain" unattested="bare" />
    </div>
  );
}

function Row({
  dragon,
  axe,
  year,
  hatch,
  onActive,
}: {
  dragon: Dragon;
  axe: Axe<HTMLDivElement>;
  year: number | null;
  hatch: string;
  onActive: (id: string | null) => void;
}) {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const life = lifeOf(dragon.id);
  const name = tx(dragon.name);
  const alive = life && year !== null ? year >= life.from && year <= life.to : null;

  let years = formatSpan(dragon.hatched, dragon.died, reading);
  if (dragon.hatched === null && dragon.died === null) years = t('page.dragons.years.unknownAlive');
  const lastSeen = life?.doubt ? t('v2.dragons.last_seen', { year: formatYear(life.sureTo, reading) }) : null;

  // La légende part de l'année où la vie commence ; près du bord droit, elle s'y aligne par la fin.
  // Le spécimen se tient juste avant la légende, ou juste après quand elle s'aligne par la fin.
  let place: { left?: number; right?: number } = {};
  let specimen: number | null = null;
  if (life && axe.ready) {
    const start = axe.x(life.from);
    const end = axe.edges(life.to)[1];
    const width = specimenWidth(dragon.look.span);
    if (start > axe.width * 0.62) {
      place = { right: Math.max(0, axe.width - end) };
      specimen = Math.min(axe.width - width - 4, end + 14);
    } else {
      place = { left: start };
      specimen = Math.max(4, start - width - 14);
    }
  }

  const riders = dragon.riders.filter((rider) => rider.personId || rider.name);

  return (
    <li
      className={styles.rangee}
      data-hors={alive === false ? '' : undefined}
      onPointerEnter={() => onActive(dragon.id)}
      onPointerLeave={() => onActive(null)}
      onFocus={() => onActive(dragon.id)}
      onBlur={() => onActive(null)}
    >
      <Silhouette dragon={dragon} name={name} left={specimen} />
      <div
        className={styles.legende}
        data-ancre={place.right !== undefined ? 'fin' : place.left !== undefined ? 'debut' : undefined}
        style={{ ['--x' as string]: `${place.left ?? 0}px`, ['--xr' as string]: `${place.right ?? 0}px` }}
      >
        <p className={styles.nom}>
          <NomEntite kind="dragon" id={dragon.id} name={dragon.name} />
          {dragon.alias ? <span className={styles.alias}>{tx(dragon.alias)}</span> : null}
        </p>
        <p className={styles.meta}>
          <span className={styles.annees}>{years}</span>
          {lastSeen ? <span>{lastSeen}</span> : null}
          {riders.length > 0 ? (
            <span>
              {t(riders.length === 1 ? 'page.dragons.riders.one' : 'page.dragons.riders.many')}{' '}
              {riders.map((rider, index) => (
                <span key={`${rider.personId ?? index}`}>
                  {index > 0 ? ', ' : null}
                  {rider.personId ? <NomEntite kind="person" id={rider.personId} name={rider.name} /> : tx(rider.name)}
                </span>
              ))}
            </span>
          ) : (
            <span>{t('page.dragons.riders.none')}</span>
          )}
        </p>
      </div>
      {life && axe.ready ? <Track dragon={dragon} life={life} axe={axe} year={year} hatch={hatch} /> : null}
    </li>
  );
}

/**
 * Les vies des dragons (spec §5.10) : une rangée par dragon, sa vie tracée exactement au-dessus
 * des mêmes années de la fasce (plein, puis hachure pour le sort inconnu), ses cavaliers en
 * traits clairs. La légende part de l'année où la vie commence, si bien que les noms
 * descendent le temps. Groupes par époque, les non datés à la fin. Survoler une rangée
 * pose la vie du dragon sur la fasce. À l'année réglée, les dragons qui ne vivent pas
 * s'effacent à demi.
 */
export function ViesDragons() {
  const t = useT();
  const year = useYear();
  const axe = useAxe<HTMLDivElement>();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hatch = `${uid}h`;
  const epochs = useMemo(() => dragonEpochs(), []);
  const [active, setActive] = useState<string | null>(null);
  const activeLife = active ? lifeOf(active) : undefined;
  useFasce(activeLife ? { span: [activeLife.from, activeLife.to] } : {}, 'transient');

  return (
    <section className={styles.section} aria-labelledby="vies">
      <div className={styles.tete}>
        <h2 id="vies" className={styles.titre}>
          {t('v2.dragons.lives')}
        </h2>
        <p className={styles.note}>{t('v2.dragons.lives_note')}</p>
      </div>
      <svg width="0" height="0" className={styles.defs} aria-hidden="true" focusable="false">
        <defs>
          <pattern id={hatch} width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={1.6} height={4} className={styles.hachure} />
          </pattern>
        </defs>
      </svg>
      <div ref={axe.ref} className={styles.figure} aria-label={t('v2.dragons.lives_label')} role="group">
        {epochs.map((epoch) => (
          <div key={epoch.period?.id ?? 'non-dates'} className={styles.epoque}>
            <h3 className={styles.epoqueTitre}>
              {epoch.period ? (
                <>
                  <span className={styles.chiffre} aria-hidden="true">
                    {toRoman(epoch.period.order)}
                  </span>
                  <Gloss text={epoch.period.title} classes={{ tr: styles.glose }} />
                </>
              ) : (
                <span>{t('v2.dragons.undated')}</span>
              )}
            </h3>
            {epoch.period ? null : <p className={styles.note}>{t('v2.dragons.undated_note')}</p>}
            <ol className={styles.liste} role="list">
              {epoch.dragons.map((dragon) => (
                <Row key={dragon.id} dragon={dragon} axe={axe} year={year} hatch={hatch} onActive={setActive} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

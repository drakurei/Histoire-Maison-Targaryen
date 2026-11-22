/*
 * Guerres `/guerres` (v3-spec §6.10, fascé, champ). Reprise de la vue de la V2
 * (src/versions/v2/pages/WarsPage.tsx), posée dans le cadre de la V3 : une rangée par conflit,
 * groupée par période ; le titre valyrien et sa glose, les années, les deux camps et leur
 * marque, le nombre de batailles, les dragons perdus ; dessous, sa place exacte sur l'échelle
 * de la fasce (au moins 6 px), ses batailles en encoches. Entrer dans un conflit : le feu part
 * de son année. Survoler une rangée pose sa durée sur la fasce.
 */
import { useMemo, useState } from 'react';

import { getPeriod } from '@/core/content/timeline';
import type { Period, War } from '@/core/content/types';
import { wars } from '@/core/content/wars';
import { formatSpan, Gloss, useLang, useT, useTx, useTypo } from '@/core/i18n';
import { toRoman } from '@/versions/v2/components/numerals';
import { Profil } from '@/versions/v2/components/Profil';
import { dragonsLost } from '@/versions/v2/pages/registres/appearances';
import { useAxe } from '@/versions/v2/pages/registres/axe';
import type { Axe } from '@/versions/v2/pages/registres/axe';
import { LienFeu } from '@/versions/v2/pages/registres/LienFeu';
import { useFasce } from '@/versions/v2/state/fasce';
import { boundsOf, DOMAIN } from '@/versions/v2/state/scene';
import { useYear } from '@/versions/v2/state/year';

import { TitreChamp } from '../components/common/TitreChamp';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import { MarqueCamp } from './registres/MarqueCamp';
import styles from './WarsPage.module.css';

/** Largeur minimale d'un conflit sur l'axe : une guerre d'un an reste visible. */
const MIN_BAR = 6;
/** La fasce en miniature sous chaque conflit : sa hauteur, et le ciel où se posent la durée et les batailles. */
const MASS = 22;
const TOP = 10;

interface Group {
  period: Period | undefined;
  wars: War[];
}

function groupsOf(): Group[] {
  const groups: Group[] = [];
  for (const war of wars) {
    const last = groups[groups.length - 1];
    if (last && last.period?.id === war.periodId) last.wars.push(war);
    else groups.push({ period: getPeriod(war.periodId), wars: [war] });
  }
  return groups;
}

function Camps({ war }: { war: War }) {
  const t = useT();
  const tx = useTx();
  const [first, second, ...rest] = war.belligerents;
  return (
    <span className={styles.camps}>
      {[first, second].map((side) =>
        side ? (
          <span key={side.id} className={styles.camp}>
            <MarqueCamp tone={side.tone} />
            {tx(side.name)}
          </span>
        ) : null,
      )}
      {rest.length > 0 ? <span className={styles.autres}>{rest.length === 1 ? t('v2.wars.more_side_one') : t('page.wars.moreSides', { n: rest.length })}</span> : null}
    </span>
  );
}

function Row({ war, axe, year, onActive }: { war: War; axe: Axe<HTMLDivElement>; year: number | null; onActive: (war: War | null) => void }) {
  const t = useT();
  const { reading } = useLang();
  const lost = dragonsLost(war).length;
  const engaged = war.battles.some((battle) => battle.dragons.length > 0);
  const count = war.battles.length;
  const battles = count === 0 ? t('v2.wars.no_battle') : count === 1 ? t('page.wars.battle') : t('page.wars.battles', { n: count });
  const dragons = !engaged
    ? t('v2.wars.no_dragons')
    : lost === 0
      ? t('v2.wars.dragons_lost.none')
      : lost === 1
        ? t('v2.wars.dragons_lost.one')
        : t('v2.wars.dragons_lost.many', { n: lost });

  let bar: { left: number; width: number } | null = null;
  if (axe.ready) {
    const [left] = axe.edges(war.from);
    const [, right] = axe.edges(war.to);
    const width = Math.max(MIN_BAR, right - left);
    bar = { left: (left + right) / 2 - width / 2, width };
  }
  const now = year !== null && year >= war.from && year <= war.to;
  const origin = axe.ready ? axe.x(DOMAIN[0]) : 0;
  const span = axe.ready ? axe.edges(DOMAIN[1])[1] - origin : 0;

  return (
    <li
      className={styles.rangee}
      data-maintenant={now ? '' : undefined}
      onPointerEnter={() => onActive(war)}
      onPointerLeave={() => onActive(null)}
      onFocus={() => onActive(war)}
      onBlur={() => onActive(null)}
    >
      <div className={styles.tete}>
        <h3 className={styles.titre}>
          <LienFeu to={`/guerres/${war.id}`} year={war.from}>
            <Gloss text={war.title} classes={{ tr: styles.glose }} />
          </LienFeu>
        </h3>
        <p className={styles.chiffres}>
          <span className={styles.annees}>{formatSpan(war.from, war.to, reading)}</span>
          <span>{battles}</span>
          <span>{dragons}</span>
        </p>
        <p className={styles.campsLigne}>
          <Camps war={war} />
        </p>
      </div>
      {bar && span > 0 ? (
        <div className={styles.axe} aria-hidden="true">
          <svg className={styles.trait} width={axe.width} height={TOP} viewBox={`0 0 ${axe.width} ${TOP}`} focusable="false">
            {war.battles
              .filter((battle) => battle.year !== null)
              .map((battle) => {
                const [a, b] = axe.edges(battle.year ?? war.from);
                return <rect key={battle.id} className={styles.bataille} x={(a + b) / 2 - 1} y={0} width={2} height={6} />;
              })}
            <rect className={styles.duree} x={bar.left} y={TOP - 2} width={bar.width} height={2} />
          </svg>
          <div className={styles.masse} style={{ marginLeft: origin }}>
            <Profil from={DOMAIN[0]} to={DOMAIN[1]} width={span} height={MASS} full={MASS} span={[war.from, war.to]} />
          </div>
        </div>
      ) : null}
    </li>
  );
}

export default function WarsPage() {
  const t = useT();
  const typo = useTypo();
  const year = useYear();
  const axe = useAxe<HTMLDivElement>();
  const groups = useMemo(() => groupsOf(), []);
  const [active, setActive] = useState<War | null>(null);
  useVue();
  useFasce(active ? { span: [active.from, active.to] } : {}, 'transient');

  return (
    <Vue partition="fasce">
      <TitreChamp k="nav.wars" className={styles.entete}>
        <p className={styles.chapeau}>{typo(t('page.wars.lead', { n: wars.length }))}</p>
      </TitreChamp>
      <p className={styles.note}>{t('v3.registres.guerres.note')}</p>
      <div ref={axe.ref} className={styles.figure} role="group" aria-label={t('page.wars.chart.label')}>
        {groups.map((group) => {
          const bounds = group.period ? boundsOf(group.period) : null;
          const crochet = bounds && axe.ready ? [axe.x(Math.max(bounds[0], -2000)), axe.edges(bounds[1])[1]] : null;
          return (
            <section key={group.period?.id ?? 'autres'} className={styles.groupe}>
              {group.period ? (
                <h2 className={styles.periode}>
                  <span className={styles.chiffre} aria-hidden="true">
                    {toRoman(group.period.order)}
                  </span>
                  <Gloss text={group.period.title} classes={{ tr: styles.glose }} />
                </h2>
              ) : null}
              {crochet ? (
                <svg className={styles.crochet} width={axe.width} height={8} viewBox={`0 0 ${axe.width} 8`} aria-hidden="true" focusable="false">
                  <path d={`M${crochet[0]} 8V1H${crochet[1]}V8`} />
                </svg>
              ) : null}
              <ol className={styles.liste} role="list">
                {group.wars.map((war) => (
                  <Row key={war.id} war={war} axe={axe} year={year} onActive={setActive} />
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </Vue>
  );
}

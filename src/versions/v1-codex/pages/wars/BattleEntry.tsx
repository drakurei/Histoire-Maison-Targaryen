import { getDragon } from '@/core/content/dragons';
import type { Battle, War } from '@/core/content/types';
import { formatYear, useLang, useT, useTitle, useTx } from '@/core/i18n';
import { DragonFigure } from '@/shared/dragon';

import { EntityLink } from '../../components/EntityLink';
import { Prose } from '../../components/Prose';
import { ReliabilityMark } from '../../components/ReliabilityMark';
import { SourceList } from '../../components/SourceList';
import { dragonName } from '../dragons/registry';
import styles from './BattleEntry.module.css';
import { belligerentOf, inSentence } from './warModel';

interface BattleEntryProps {
  war: War;
  battle: Battle;
  /** Rang dans la guerre, celui que porte la carte de situation. */
  number: number;
  /** Vrai si la bataille a son signe sur la carte. */
  mapped: boolean;
}

/**
 * Une bataille dans l'ordre de la guerre : numéro et année en marge, lieu, camps et issue,
 * récit, dragons engagés et leur sort, sources en marge.
 */
export function BattleEntry({ war, battle, number, mapped }: BattleEntryProps) {
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();
  const [a, b] = battle.sides;
  const sideA = belligerentOf(war, a);
  const sideB = belligerentOf(war, b);
  const victor = battle.victor === 'indecis' ? null : belligerentOf(war, battle.victor);

  return (
    <li id={battle.id} className={styles.battle} tabIndex={-1}>
      <p className={styles.margin}>
        <span className={styles.number} data-mapped={mapped || undefined}>
          {number}
        </span>
        <span className={styles.year}>{formatYear(battle.year, reading)}</span>
        {battle.dateCertainty !== 'exacte' ? <span className={styles.approx}>{t(`page.war.date.${battle.dateCertainty}`)}</span> : null}
      </p>

      <div className={styles.body}>
        <h3 className={styles.name}>{title(battle.name).primary}</h3>
        <p className={styles.place}>
          <EntityLink kind="place" id={battle.placeId} name={battle.placeName} />
        </p>
        <p className={styles.issue}>
          <span>{t('page.war.between', { a: tx(sideA?.name), b: inSentence(tx(sideB?.name)) })}</span>
          <span className={styles.victor}>
            {victor ? t('page.war.victor', { side: inSentence(tx(victor.name)) }) : t('page.war.undecided')}
          </span>
          <ReliabilityMark level={battle.reliability} />
        </p>
        <Prose text={battle.summary} className={styles.summary} />
        {battle.outcome ? <p className={styles.outcome}>{tx(battle.outcome)}</p> : null}
        {battle.losses ? (
          <p className={styles.losses}>
            <span className={styles.lead}>{t('page.war.losses')}</span> {tx(battle.losses)}
          </p>
        ) : null}

        {battle.dragons.length > 0 ? (
          <ul className={styles.dragons} role="list" aria-label={t('page.war.dragons')}>
            {battle.dragons.map((entry) => {
              const dragon = getDragon(entry.dragonId);
              const side = belligerentOf(war, entry.side);
              return (
                <li key={entry.dragonId} className={styles.dragon}>
                  <div className={styles.thumb} aria-hidden="true">
                    {dragon ? <DragonFigure look={dragon.look} title={title(dragonName(dragon)).primary} tone="engraving" detail="plain" /> : null}
                  </div>
                  <div>
                    <p className={styles.dragonName}>
                      {dragon ? <EntityLink kind="dragon" id={dragon.id} name={dragonName(dragon)} /> : entry.dragonId}
                      {side ? <span className={styles.dragonSide}>{tx(side.name)}</span> : null}
                    </p>
                    <p className={styles.dragonFate}>{tx(entry.fate)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <aside className={styles.sources} aria-label={t('label.sources')}>
        <SourceList sources={battle.sources} />
      </aside>
    </li>
  );
}

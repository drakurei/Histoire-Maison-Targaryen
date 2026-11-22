import { getDragon } from '@/core/content/dragons';
import { getPlace } from '@/core/content/places';
import type { Battle, Belligerent, War } from '@/core/content/types';
import { formatYear, useLang, useT, useTitle, useTxTypo } from '@/core/i18n';
import { Prose } from '@/versions/v1-codex/components/Prose';
import { ReliabilityMark } from '@/versions/v1-codex/components/ReliabilityMark';

import { Nom } from '../../components/common/Nom';
import { MarqueCamp } from './MarqueCamp';
import styles from './Bataille.module.css';

function sideOf(war: War, id: string): Belligerent | undefined {
  return war.belligerents.find((side) => side.id === id);
}

interface BatailleProps {
  war: War;
  battle: Battle;
  index: number;
  current: boolean;
  /** Au téléphone : précédente et suivante au pied de la bataille. */
  onStep?: (index: number) => void;
}

/**
 * Une bataille sur le folio (v3-spec §6.11) : le numéro d'ordre en Grenze rubrique dans la
 * colonne suspendue (celui que porte la carte), l'année, le nom en `h3` ancré `#<battleId>`,
 * le lieu ou « lieu inconnu », l'issue, les dragons engagés et leur sort, le récit, les
 * pertes, la fiabilité.
 */
export function Bataille({ war, battle, index, current, onStep }: BatailleProps) {
  const t = useT();
  const tx = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const place = battle.placeId ? getPlace(battle.placeId) : undefined;
  const victor = battle.victor === 'indecis' ? undefined : sideOf(war, battle.victor);
  const total = war.battles.length;
  const name = title(battle.name);

  return (
    <li id={battle.id} className={styles.bataille} data-courante={current ? '' : undefined} tabIndex={-1} aria-labelledby={`${battle.id}-nom`}>
      <span className={styles.numero} aria-hidden="true">
        {index + 1}
      </span>
      <div className={styles.corps}>
        <p className={styles.date}>
          {formatYear(battle.year, reading)}
          {battle.dateCertainty !== 'exacte' ? <span className={styles.approche}>{t(`page.war.date.${battle.dateCertainty}`)}</span> : null}
        </p>
        <h3 id={`${battle.id}-nom`} className={styles.nom}>
          <span className="sr-only">{t('v2.war.number', { n: index + 1 })}, </span>
          {name.primary}
        </h3>
        <p className={styles.lieu}>
          {place ? <Nom kind="place" id={place.id} name={place.name} /> : <span className={styles.pale}>{t('v2.war.place_unknown')}</span>}
          {battle.placeName ? <span className={styles.precision}>{tx(battle.placeName)}</span> : null}
        </p>
        <p className={styles.issue}>
          {victor ? (
            <>
              <MarqueCamp tone={victor.tone} /> {t('page.war.victor', { side: tx(victor.name) })}
            </>
          ) : (
            t('page.war.undecided')
          )}
          <ReliabilityMark level={battle.reliability} />
        </p>
        {battle.dragons.length > 0 ? (
          <div className={styles.dragons}>
            <p className={styles.etiquette}>{t('page.war.dragons')}</p>
            <ul className={styles.dragonsListe} role="list">
              {battle.dragons.map((engaged) => {
                const dragon = getDragon(engaged.dragonId);
                const side = sideOf(war, engaged.side);
                return (
                  <li key={engaged.dragonId} className={styles.dragon}>
                    <span className={styles.dragonNom}>
                      {side ? <MarqueCamp tone={side.tone} /> : null}
                      {dragon ? <Nom kind="dragon" id={dragon.id} name={dragon.name} /> : engaged.dragonId}
                    </span>
                    <span className={styles.sort}>{tx(engaged.fate)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <Prose text={battle.summary} />
        {battle.outcome ? <Prose text={battle.outcome} /> : null}
        {battle.losses ? (
          <p className={styles.pertes}>
            <span className={styles.etiquette}>{t('page.war.losses')}</span> {tx(battle.losses)}
          </p>
        ) : null}
        {onStep && total > 1 ? (
          <nav className={styles.pas} aria-label={t('v2.war.replay_label')}>
            {index > 0 ? (
              <button type="button" className={styles.bouton} onClick={() => onStep(index - 1)}>
                {t('v2.war.replay_previous')}
              </button>
            ) : null}
            {index < total - 1 ? (
              <button type="button" className={styles.bouton} onClick={() => onStep(index + 1)}>
                {t('v2.war.replay_next')}
              </button>
            ) : null}
          </nav>
        ) : null}
      </div>
    </li>
  );
}

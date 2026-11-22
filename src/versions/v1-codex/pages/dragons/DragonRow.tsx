import { VLink } from '@/app/version';
import { getPerson } from '@/core/content/people';
import type { Dragon } from '@/core/content/types';
import { formatSpan, formatYear, useLang, useT, useTitle, useTx, VALYRIAN_TAG } from '@/core/i18n';
import { DragonFigure } from '@/shared/dragon';

import { EntityLink } from '../../components/EntityLink';
import { ReliabilityMark } from '../../components/ReliabilityMark';
import styles from './DragonRow.module.css';
import { dragonName } from './registry';

interface DragonRowProps {
  dragon: Dragon;
}

/** Années d'un dragon : éclosion et mort, ou ce que la chronique en dit. */
export function useDragonYears(): (dragon: Dragon) => string {
  const t = useT();
  const { reading } = useLang();
  return (dragon: Dragon) => {
    if (dragon.died === null) {
      return dragon.hatched === null
        ? t('page.dragons.years.unknownAlive')
        : t('page.dragons.years.since', { year: formatYear(dragon.hatched, reading) });
    }
    if (dragon.hatched === null) return t('page.dragons.years.until', { year: formatYear(dragon.died, reading) });
    return formatSpan(dragon.hatched, dragon.died, reading);
  };
}

/**
 * Une entrée du registre : la petite gravure du dragon, à la taille de son envergure (Balerion
 * remplit la case), son nom, son surnom, ses années, ses cavaliers, et son sort.
 */
export function DragonRow({ dragon }: DragonRowProps) {
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const years = useDragonYears();
  const name = title(dragonName(dragon));
  const riders = dragon.riders;

  return (
    <li className={styles.row}>
      <div className={styles.thumb} aria-hidden="true">
        <div className={styles.figure} style={{ inlineSize: `${Math.round(34 + 66 * Math.min(dragon.look.span, 1))}%` }}>
          <DragonFigure look={dragon.look} title={name.primary} tone="engraving" detail="plain" />
        </div>
      </div>

      <div className={styles.ident}>
        <h3 className={styles.name}>
          <VLink to={`/dragons/${dragon.id}`} className={styles.nameLink} lang={name.isHv ? VALYRIAN_TAG : undefined}>
            {name.primary}
          </VLink>
        </h3>
        {dragon.alias ? <p className={styles.alias}>{tx(dragon.alias)}</p> : null}
        <p className={styles.years}>{years(dragon)}</p>
      </div>

      <p className={styles.riders}>
        {riders.length > 0 ? (
          <>
            <span className={styles.lead}>{t(riders.length > 1 ? 'page.dragons.riders.many' : 'page.dragons.riders.one')}</span>{' '}
            {riders.map((rider, index) => (
              <span key={`${rider.personId ?? 'x'}-${index}`}>
                <EntityLink kind="person" id={rider.personId} name={rider.name} king={rider.personId ? getPerson(rider.personId)?.king : false} />
                {index < riders.length - 2 ? ', ' : index === riders.length - 2 ? ` ${t('page.dragons.riders.and')} ` : ''}
              </span>
            ))}
          </>
        ) : (
          <span className={styles.lead}>{dragon.ridersNote ? tx(dragon.ridersNote) : t('page.dragons.riders.none')}</span>
        )}
      </p>

      <p className={styles.fate}>
        {tx(dragon.fate)}
        <ReliabilityMark level={dragon.reliability} compact className={styles.mark} />
      </p>
    </li>
  );
}

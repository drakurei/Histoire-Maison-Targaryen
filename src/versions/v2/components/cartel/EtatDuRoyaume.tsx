import { getDragon } from '@/core/content/dragons';
import { events } from '@/core/content/timeline';
import { formatYear, Gloss, useLang, useT, useTitle, useTx, VALYRIAN_TAG, yearParts } from '@/core/i18n';

import { periodsAt, presenceAt, reignsAt, stepYear } from '../../model/presence';
import { DATED_YEARS, DOMAIN, periods, presence, sovereigns, wars } from '../../state/scene';
import { useSetYear, useYear } from '../../state/year';
import { withoutHouse } from '../fasce/useYearInfo';
import { YearNumeral } from '../fasce/YearNumeral';
import { Lien } from '../Lien';
import { NomEntite } from '../NomEntite';
import { toRoman } from '../numerals';

import styles from './EtatDuRoyaume.module.css';

/** Les cinq années annotées du portail : le Fléau, la Conquête, le plus haut, le dernier dragon, les éclosions. */
const NOTED_YEARS: readonly number[] = [-102, -2, 130, 153, 299];

/**
 * L'état du royaume à l'année réglée (spec §5.3) : le règne, les dragons vivants (et à part
 * ceux dont le sort est inconnu), les guerres en cours, les événements de l'année.
 */
export function EtatDuRoyaume() {
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();
  const year = useYear();
  const setYear = useSetYear();

  if (year === null) {
    return (
      <div className={styles.root}>
        <h2 className={styles.titreVide}>
          <Gloss k="v2.state.title_none" />
        </h2>
        <p className={styles.vide}>{t('v2.state.empty')}</p>
        <ul role="list" className={styles.annees}>
          {NOTED_YEARS.map((noted) => (
            <li key={noted}>
              <button type="button" className={styles.annee} onClick={() => setYear(noted)}>
                {formatYear(noted, reading)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const entry = presenceAt(presence, year);
  const reigns = reignsAt(sovereigns, year);
  const running = wars.filter((war) => war.from <= year && year <= war.to);
  const happened = events.filter((event) => event.year !== null && event.year <= year && year <= (event.yearEnd ?? event.year));
  const previous = stepYear(DATED_YEARS, year, -1);
  const next = stepYear(DATED_YEARS, year, 1);
  const parts = yearParts(year, reading);

  return (
    <div className={styles.root}>
      <div className={styles.tete}>
        <h2 className={styles.titre}>
          <span className="sr-only">{t('v2.state.title', { year: formatYear(year, reading) })}</span>
          <span aria-hidden="true" className={styles.nombre}>
            <YearNumeral value={parts?.value ?? ''} />
            <span className={`${styles.ere} ere`}>{parts?.era}</span>
          </span>
        </h2>
        <div className={styles.crans}>
          <button type="button" className={styles.cran} disabled={previous === null} onClick={() => setYear(previous)} aria-label={t('v2.fasce.step_previous')}>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className={styles.cran} disabled={next === null} onClick={() => setYear(next)} aria-label={t('v2.fasce.step_next')}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <ul role="list" className={styles.periodes}>
        {periodsAt(periods, year, DOMAIN[0]).map((period) => {
          const name = title(period.title);
          return (
            <li key={period.id} className={styles.periode}>
              <span className={styles.chiffrePeriode} aria-hidden="true">
                {toRoman(period.order)}
              </span>
              <span>
                <Lien to={`/chroniques/${period.id}`}>
                  <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
                </Lien>
                {name.gloss ? <span className={styles.glose}>{name.gloss}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>

      <section className={styles.section}>
        <h3 className={styles.intertitre}>
          <Gloss k="label.reign" />
        </h3>
        {reigns.length > 0 ? (
          <ul role="list" className={styles.liste}>
            {reigns.map((sovereign) => (
              <li key={sovereign.id} className={styles.regne}>
                {sovereign.ordinal !== null ? (
                  <span className={styles.ordinal} aria-hidden="true">
                    {toRoman(sovereign.ordinal)}
                  </span>
                ) : null}
                <span>
                  <NomEntite kind="person" id={sovereign.id}>
                    {withoutHouse(tx(sovereign.name))}
                  </NomEntite>
                  {sovereign.epithet ? <span className={styles.epithete}> {tx(sovereign.epithet)}</span> : null}
                  <span className={styles.depuis}> {t('v2.state.since', { year: formatYear(sovereign.reignFrom, reading) })}</span>
                  {sovereign.contested ? <span className={styles.depuis}>{t('v2.state.contested')}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.aucun}>{t('v2.state.no_reign')}</p>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.intertitre}>{t('v2.state.dragons', { n: entry?.attested.length ?? 0 })}</h3>
        {entry && entry.attested.length > 0 ? (
          <p className={styles.noms}>
            {entry.attested.map((id, index) => {
              const dragon = getDragon(id);
              return dragon ? (
                <span key={id}>
                  {index > 0 ? ', ' : null}
                  <NomEntite kind="dragon" id={id} name={dragon.name} />
                </span>
              ) : null;
            })}
          </p>
        ) : null}
        {entry && entry.doubtful.length > 0 ? (
          <p className={styles.doute}>
            <span className={styles.hachure} aria-hidden="true" />
            {t('v2.state.unknown_fate')}{' '}
            {entry.doubtful.map((id, index) => {
              const dragon = getDragon(id);
              return dragon ? (
                <span key={id}>
                  {index > 0 ? ', ' : null}
                  <NomEntite kind="dragon" id={id} name={dragon.name} />
                </span>
              ) : null;
            })}
          </p>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3 className={styles.intertitre}>{t('v2.state.wars')}</h3>
        {running.length > 0 ? (
          <ul role="list" className={styles.liste}>
            {running.map((war) => (
              <li key={war.id}>
                <NomEntite kind="war" id={war.id} name={war.title} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.aucun}>{t('v2.cartel.none')}</p>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.intertitre}>{t('v2.state.this_year')}</h3>
        {happened.length > 0 ? (
          <ul role="list" className={styles.liste}>
            {happened.map((event) => (
              <li key={event.id}>
                <Lien to={`/chroniques/${event.periodId}/${event.id}`} year={event.year}>
                  {tx(event.title)}
                </Lien>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.aucun}>{t('v2.state.nothing_dated')}</p>
        )}
      </section>

      <button type="button" className={styles.toutTemps} onClick={() => setYear(null)}>
        {t('v2.fasce.all_time')}
      </button>
    </div>
  );
}

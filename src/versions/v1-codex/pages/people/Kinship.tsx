import type { Person } from '@/core/content/types';
import { focusOn } from '@/core/genealogy';
import { formatYear, useLang, useT } from '@/core/i18n';

import { EntityLink } from '../../components/EntityLink';
import { CROWNED, graph, lifeYears, shortName } from '../lineage/model';
import { useKinWords } from '../lineage/useKinWords';
import styles from './Kinship.module.css';

function Name({ person }: { person: Person }) {
  const { reading } = useLang();
  const years = lifeYears(person, reading);
  return (
    <span className={styles.name}>
      <EntityLink kind="person" id={person.id} name={{ fr: shortName(person, 'fr'), en: shortName(person, 'en') }} king={CROWNED.has(person.id)} />
      {years ? <span className={styles.years}>{years}</span> : null}
    </span>
  );
}

/**
 * La parenté en notation généalogique, comme dans une table imprimée : la filiation, puis
 * chaque union numérotée (le signe « x », l'année, le conjoint et son lien de sang), et sous
 * elle les enfants qui en sont nés ; enfin la fratrie. Chaque nom mène à sa fiche.
 */
export function Kinship({ person }: { person: Person }) {
  const t = useT();
  const { reading } = useLang();
  const words = useKinWords();
  const view = focusOn(graph, person.id);
  if (!view) return null;

  const parentsKin = view.parentsConsanguinity?.consanguineous ? words.blood(view.parentsConsanguinity.kinship) : null;
  // Seuls les mariages sont numérotés, comme dans une table : une liaison n'est pas un rang.
  const marriages = view.unions.filter((entry) => entry.union?.type === 'mariage');
  const numbered = marriages.length > 1;

  return (
    <div className={styles.table}>
      <div className={styles.row}>
        <p className={styles.sign}>{words.childOf(person)}</p>
        <div className={styles.cell}>
          {view.parents.length > 0 ? (
            <p className={styles.line}>
              {view.parents.map((parent, index) => (
                <span key={parent.person.id}>
                  {index > 0 ? <span className={styles.mark}> {view.parentsUnion ? words.unionMark(view.parentsUnion.type) : t('page.lignee.and')} </span> : null}
                  <Name person={parent.person} />
                </span>
              ))}
            </p>
          ) : (
            <p className={styles.quiet}>{t('page.lignee.panel.noParents')}</p>
          )}
          {parentsKin ? <p className={styles.kin}>{t('page.lignee.panel.parentsKin', { kin: parentsKin })}</p> : null}
          {view.allegedFather ? (
            <p className={styles.kin}>
              {t('page.person.kin.alleged')} <Name person={view.allegedFather} />
            </p>
          ) : null}
        </div>
      </div>

      {view.unions.map((entry, index) => {
        const kin = entry.consanguinity?.consanguineous ? words.blood(entry.consanguinity.kinship) : null;
        const coefficient = words.coefficient(entry.consanguinity);
        const mark = entry.union ? words.unionMark(entry.union.type) : t('page.lignee.union.none');
        return (
          <div key={entry.union?.id ?? `f${index}`} className={styles.row}>
            <p className={styles.sign}>
              <span className={styles.mark}>{mark}</span>
              {numbered && entry.union?.type === 'mariage' ? <span className={styles.number}>{marriages.indexOf(entry) + 1}</span> : null}
            </p>
            <div className={styles.cell}>
              <p className={styles.line}>
                {entry.union?.year !== null && entry.union?.year !== undefined ? <span className={styles.when}>{formatYear(entry.union.year, reading)}</span> : null}
                {entry.partner ? <Name person={entry.partner} /> : <span className={styles.quiet}>{t('page.lignee.panel.unknownPartner')}</span>}
              </p>
              {kin ? (
                <p className={styles.kin}>
                  {kin}
                  {coefficient ? <span className={styles.coefficient}>{coefficient}</span> : null}
                </p>
              ) : null}
              {entry.children.length > 0 ? (
                <p className={styles.issue}>
                  <span className={styles.mark}>{t('page.person.kin.issue')} </span>
                  {entry.children.map((child, position) => (
                    <span key={child.id}>
                      <Name person={child} />
                      {position < entry.children.length - 1 ? <span className={styles.sep}>, </span> : null}
                    </span>
                  ))}
                </p>
              ) : (
                <p className={styles.quiet}>{t('page.lignee.panel.noChildren')}</p>
              )}
            </div>
          </div>
        );
      })}

      {view.siblings.length > 0 ? (
        <div className={styles.row}>
          <p className={styles.sign}>{t('page.person.kin.siblings')}</p>
          <p className={`${styles.cell} ${styles.line}`}>
            {view.siblings.map((sibling, position) => (
              <span key={sibling.person.id}>
                <Name person={sibling.person} />
                {sibling.kind === 'half' ? (
                  <span className={styles.half}> {t(sibling.person.sex === 'f' ? 'page.lignee.kin.halfSibling.f' : 'page.lignee.kin.halfSibling.m')}</span>
                ) : null}
                {position < view.siblings.length - 1 ? <span className={styles.sep}>, </span> : null}
              </span>
            ))}
          </p>
        </div>
      ) : null}
    </div>
  );
}

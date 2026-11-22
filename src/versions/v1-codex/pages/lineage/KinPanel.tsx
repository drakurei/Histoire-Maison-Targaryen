import { useId } from 'react';

import { VLink } from '@/app/version';
import { getPerson, sovereigns } from '@/core/content/people';
import type { Person } from '@/core/content/types';
import { focusOn } from '@/core/genealogy';
import { formatSpan, formatYear, useLang, useT, useTxTypo } from '@/core/i18n';
import { CrownGlyph } from '@/shared/marks/Marks';

import { ReliabilityMark } from '../../components/ReliabilityMark';
import styles from './KinPanel.module.css';
import { CROWNED, graph, lifeYears, shortName } from './model';
import { useKinWords } from './useKinWords';

interface KinPanelProps {
  id: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** `side` : volet à droite du rouleau ; `sheet` : feuillet posé en bas, sur téléphone. */
  placement: 'side' | 'sheet';
}

function PersonButton({ person, onSelect, note }: { person: Person; onSelect: (id: string) => void; note?: string | null }) {
  const { reading } = useLang();
  const t = useT();
  const years = lifeYears(person, reading);
  return (
    <span className={styles.person}>
      <button type="button" className={styles.personButton} onClick={() => onSelect(person.id)} title={t('page.lignee.panel.centerOn', { name: shortName(person, reading) })}>
        {CROWNED.has(person.id) ? <CrownGlyph size="0.9em" className={styles.crown} title={t('label.king')} /> : null}
        {shortName(person, reading)}
      </button>
      {years ? <span className={styles.years}>{years}</span> : null}
      {note ? <span className={styles.note}>{note}</span> : null}
    </span>
  );
}

/**
 * Le volet de la lignée : la personne centrée, ses parents, ses unions et les enfants de
 * chacune, sa fratrie, et le lien vers sa fiche. Non modal : le rouleau reste à portée.
 * Chaque nom recentre l'arbre sur cette personne.
 */
export function KinPanel({ id, onSelect, onClose, placement }: KinPanelProps) {
  const t = useT();
  const tx = useTxTypo();
  const { reading } = useLang();
  const words = useKinWords();
  const headingId = useId();
  const view = focusOn(graph, id);
  if (!view) return null;

  const { person } = view;
  const sovereign = sovereigns.find((entry) => entry.id === person.id);
  const years = lifeYears(person, reading);
  const parentsKin = view.parentsConsanguinity?.consanguineous ? words.blood(view.parentsConsanguinity.kinship) : null;
  const doubtfulParentage = view.parentage && view.parentage.certainty !== 'etabli' ? view.parentage : null;

  return (
    <aside className={styles.panel} data-placement={placement} aria-labelledby={headingId} data-pan-ignore="">
      <header className={styles.head}>
        <h2 id={headingId} className={styles.name}>
          {CROWNED.has(person.id) ? <CrownGlyph size="0.8em" className={styles.crown} title={t('label.king')} /> : null}
          {shortName(person, reading)}
        </h2>
        {person.epithet ? <p className={styles.epithet}>{tx(person.epithet)}</p> : null}
        {years ? <p className={styles.dates}>{years}</p> : null}
        {sovereign ? <p className={styles.reign}>{t('page.lignee.panel.reign', { span: formatSpan(sovereign.reignFrom, sovereign.reignTo, reading) })}</p> : null}
        <button type="button" className={styles.close} onClick={onClose} aria-label={t('page.lignee.panel.close')}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
      </header>

      <section className={styles.block}>
        <h3 className={styles.blockTitle}>{t('page.lignee.panel.parents')}</h3>
        {view.parents.length > 0 ? (
          <p className={styles.couple}>
            {view.parents.map((parent, index) => (
              <span key={parent.person.id} className={styles.coupleMember}>
                {index > 0 ? <span className={styles.mark}>{view.parentsUnion ? words.unionMark(view.parentsUnion.type) : t('page.lignee.and')}</span> : null}
                <PersonButton person={parent.person} onSelect={onSelect} />
              </span>
            ))}
          </p>
        ) : (
          <p className={styles.quiet}>{t('page.lignee.panel.noParents')}</p>
        )}
        {parentsKin ? <p className={styles.quiet}>{t('page.lignee.panel.parentsKin', { kin: parentsKin })}</p> : null}
        {doubtfulParentage ? (
          <p className={styles.doubt}>
            <ReliabilityMark level={doubtfulParentage.certainty} compact />
            <span>{view.allegedFather ? t('page.lignee.panel.alleged', { name: shortName(view.allegedFather, reading) }) : tx(doubtfulParentage.note)}</span>
          </p>
        ) : null}
      </section>

      {view.unions.length > 0 ? (
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>{t('page.lignee.panel.unions')}</h3>
          <ol className={styles.unions} role="list">
            {view.unions.map((entry, index) => {
              const kin = entry.consanguinity?.consanguineous ? words.blood(entry.consanguinity.kinship) : null;
              const coefficient = words.coefficient(entry.consanguinity);
              const mark = entry.union ? words.unionMark(entry.union.type) : t('page.lignee.union.none');
              const year = entry.union?.year ?? null;
              return (
                <li key={entry.union?.id ?? `f${index}`} className={styles.union} data-consanguine={kin ? '' : undefined}>
                  <p className={styles.unionHead}>
                    <span className={styles.mark}>{mark}</span>
                    {year !== null ? <span className={styles.years}>{formatYear(year, reading)}</span> : null}
                    {entry.partner ? <PersonButton person={entry.partner} onSelect={onSelect} /> : <span className={styles.quiet}>{t('page.lignee.panel.unknownPartner')}</span>}
                  </p>
                  {kin ? (
                    <p className={styles.kin}>
                      {kin}
                      {coefficient ? <span className={styles.coefficient}>{coefficient}</span> : null}
                    </p>
                  ) : null}
                  {entry.children.length > 0 ? (
                    <ul className={styles.children} role="list" aria-label={t('page.lignee.panel.childrenOf', { name: entry.partner ? shortName(entry.partner, reading) : '' })}>
                      {entry.children.map((child) => (
                        <li key={child.id}>
                          <PersonButton person={child} onSelect={onSelect} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.quiet}>{t('page.lignee.panel.noChildren')}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {view.siblings.length > 0 ? (
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>{t('page.lignee.panel.siblings')}</h3>
          <ul className={styles.siblings} role="list">
            {view.siblings.map((sibling) => (
              <li key={sibling.person.id}>
                <PersonButton
                  person={sibling.person}
                  onSelect={onSelect}
                  note={sibling.kind === 'half' ? t(sibling.person.sex === 'f' ? 'page.lignee.kin.halfSibling.f' : 'page.lignee.kin.halfSibling.m') : null}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <VLink to={`/personnages/${person.id}`} className={styles.read}>
        {t('page.lignee.panel.read', { name: shortName(getPerson(person.id) ?? person, reading) })}
      </VLink>
    </aside>
  );
}

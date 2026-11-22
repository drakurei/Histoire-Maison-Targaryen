import { MAIN_ID } from '@/app/a11y';
import { VLink } from '@/app/version';
import { Gloss, useLang, useT } from '@/core/i18n';

import { VolumeList } from '../pages/chronicles/VolumeList';
import { Folio } from './Folio';
import { col } from './grid';
import styles from './NotFound.module.css';
import { Rubric } from './Rubric';

/**
 * Page introuvable du Codex (v1-codex.md §3) : une feuille de vélin comme les autres, la
 * formule « Kesir ilos daor. » rubriquée, ce qui s'est passé, puis la table des huit volumes
 * pour repartir. `data-ecran` est lu par l'audit des liens (tests/functional/links.mjs).
 */
export function NotFound() {
  const t = useT();
  const { reading } = useLang();
  return (
    <main id={MAIN_ID} tabIndex={-1} data-ecran="introuvable">
      <Folio>
        <Rubric as="h1" size="monumental" k="phrase.not_found" />
        <p className={`${styles.body} ${col.recit}`} lang={reading}>
          {t('error.notFound.body')}
        </p>
        <p className={col.recit}>
          <VLink to="/" className={styles.action}>
            <Gloss k="nav.portal" classes={{ main: styles.actionMain, tr: styles.actionTr }} />
          </VLink>
        </p>
        <section className={`${col.rangee} ${styles.table}`} aria-labelledby="introuvable-volumes">
          <Rubric as="h2" id="introuvable-volumes" k="nav.chronicles" className={styles.tableTitle} />
          <VolumeList heading="h3" />
        </section>
      </Folio>
    </main>
  );
}

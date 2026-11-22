import { VLink } from '@/app/version';
import { useT, useUi, VALYRIAN_TAG } from '@/core/i18n';
import { Emblem } from '@/shared/emblem/Emblem';

import { LangSwitch } from './LangSwitch';
import { SupportSwitch } from './SupportSwitch';
import styles from './TopBar.module.css';

interface TopBarProps {
  /** Ouvre le panneau de recherche. */
  onSearch: () => void;
}

/**
 * TopBar : barre haute de 56 px posée sur la pierre, sans filet. Emblème et nom du site à
 * gauche (lien vers le portail) ; à droite, sur écran large, le déclencheur de recherche
 * et les langues. Sous 1024 px, la recherche et les langues passent dans l'étagère.
 */
export function TopBar({ onSearch }: TopBarProps) {
  const ui = useUi();
  const t = useT();
  const site = ui('title.site');

  return (
    <header className={styles.bar}>
      <VLink to="/" className={styles.home}>
        <Emblem className={styles.emblem} />
        <span className={styles.name} lang={site.isHv ? VALYRIAN_TAG : undefined}>
          {site.primary}
        </span>
        {site.gloss ? <span className="sr-only">{site.gloss}</span> : null}
      </VLink>

      <div className={styles.tools}>
        <button type="button" className={styles.search} onClick={onSearch} aria-haspopup="dialog">
          <span className={styles.searchText}>{t('page.bati.search.trigger')}</span>
          <kbd className={styles.key} aria-hidden="true">
            /
          </kbd>
        </button>
        <LangSwitch />
        <SupportSwitch />
      </div>
    </header>
  );
}

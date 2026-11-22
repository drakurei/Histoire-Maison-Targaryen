import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { useSeuil, useSeuilReady } from '@/shared/seuil/SeuilGate';
import { CartelHost } from '@/versions/v2/components/cartel/CartelHost';
import { Dracarys } from '@/versions/v2/components/Dracarys';
import { FeuHost } from '@/versions/v2/components/Feu';
import { PageLayer } from '@/versions/v2/components/PageLayer';
import { RegisterLine } from '@/versions/v2/components/RegisterLine';
import { SheetsContext } from '@/versions/v2/components/sheets';
import { useVoir } from '@/versions/v2/state/useVoir';

import { Colophon3 } from './components/frame/Colophon3';
import { Fasce3, useEtatFasce } from './components/frame/Fasce3';
import { Index3 } from './components/frame/Index3';
import './theme.css';
import styles from './Layout.module.css';

/** La recherche et son index ne se chargent qu'à la première ouverture. */
const SearchSheet = lazy(() => import('@/versions/v2/components/SearchSheet'));

const TYPING = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

type Sheet = 'search' | 'index' | null;

/**
 * Mise en page de la version 3, « le Codex armorié » (v3-spec §3, §4.2) : le champ
 * d'obsidienne (.v3), la ligne des registres qui défile, la couche de la vue (fondu de
 * 160 ms), le colophon ; et hors de la couche ce qui ne se démonte jamais : la fasce fixe,
 * le cartel, l'Index, la recherche, le feu, « dracarys ». Signale au seuil que la première
 * vue est montée.
 */
export function Layout() {
  useSeuilReady();
  const { open: seuilOpen } = useSeuil();
  const etat = useEtatFasce();
  const [sheet, setSheet] = useState<Sheet>(null);
  const openSearch = useCallback(() => setSheet('search'), []);
  const openIndex = useCallback(() => setSheet('index'), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const sheets = useMemo(() => ({ openSearch, openIndex }), [openSearch, openIndex]);
  const { voir } = useVoir();

  // « / » ouvre la recherche, sauf quand le lecteur écrit déjà quelque part.
  useEffect(() => {
    if (seuilOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest(TYPING)) return;
      event.preventDefault();
      setSheet('search');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [seuilOpen]);

  return (
    <div className={`v3 ${styles.root}`} data-fasce={etat} data-cartel={voir ? '' : undefined}>
      <SheetsContext value={sheets}>
        <FeuHost>
          <RegisterLine />
          <div className={styles.champ}>
            <PageLayer>
              <Suspense fallback={<div className={styles.attente} />}>
                <Outlet />
              </Suspense>
            </PageLayer>
            <Colophon3 />
          </div>
          <Fasce3 onSearch={openSearch} onIndex={openIndex} />
          <CartelHost />
          {sheet === 'index' ? <Index3 onClose={closeSheet} onSearch={openSearch} /> : null}
          {sheet === 'search' ? (
            <Suspense fallback={null}>
              <SearchSheet onClose={closeSheet} />
            </Suspense>
          ) : null}
          <Dracarys disabled={seuilOpen || sheet !== null} />
        </FeuHost>
      </SheetsContext>
    </div>
  );
}

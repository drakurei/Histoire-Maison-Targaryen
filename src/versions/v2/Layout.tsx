import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';

import { useSeuil, useSeuilReady } from '@/shared/seuil/SeuilGate';

import { CartelHost } from './components/cartel/CartelHost';
import { Colophon } from './components/Colophon';
import { Dracarys } from './components/Dracarys';
import { Fasce } from './components/fasce/Fasce';
import { FeuHost } from './components/Feu';
import { IndexSheet } from './components/IndexSheet';
import { PageLayer } from './components/PageLayer';
import { RegisterLine } from './components/RegisterLine';
import { SheetsContext } from './components/sheets';
import { useFasceState } from './state/fasce';
import { useVoir } from './state/useVoir';
import './theme.css';
import styles from './Layout.module.css';

/** La recherche et son index (plus de 300 Ko) ne se chargent qu'à la première ouverture. */
const SearchSheet = lazy(() => import('./components/SearchSheet'));

const TYPING = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

type Sheet = 'search' | 'index' | null;

/**
 * Mise en page de la version 2, « Sable et gueules » (spec §2) : le champ d'obsidienne
 * (.v2), la ligne des registres qui défile, la couche de la vue, le colophon, et hors de la
 * couche ce qui ne se démonte jamais : la fasce fixe, le cartel, l'Index, la recherche, le
 * feu. Signale au seuil que la première vue est montée.
 */
export function Layout() {
  useSeuilReady();
  const { open: seuilOpen } = useSeuil();
  const fasce = useFasceState();
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
    <div
      className={`v2 ${styles.root}`}
      data-majeste={fasce.majesty ? '' : undefined}
      style={fasce.majesty ? ({ '--v2-majeste': `${fasce.majesty}svh` } as CSSProperties) : undefined}
      data-cartel={voir ? '' : undefined}
    >
      <SheetsContext value={sheets}>
      <FeuHost>
        <RegisterLine />
        <div className={styles.champ}>
          <PageLayer>
            <Suspense fallback={<div className={styles.attente} />}>
              <Outlet />
            </Suspense>
          </PageLayer>
          <Colophon />
        </div>
        <Fasce onSearch={openSearch} onIndex={openIndex} />
        <CartelHost />
        {sheet === 'index' ? <IndexSheet onClose={closeSheet} onSearch={openSearch} /> : null}
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

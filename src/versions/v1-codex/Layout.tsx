import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { useSeuil, useSeuilReady } from '@/shared/seuil/SeuilGate';

import { Desk } from './components/Desk';
import { Shelf } from './components/Shelf';
import { Spines } from './components/Spines';
import { Table } from './components/Table';
import { TopBar } from './components/TopBar';
import './theme.css';

/** Le panneau de recherche et son index (plus de 200 Ko) ne se chargent qu'à la première ouverture. */
const SearchPanel = lazy(() => import('./components/SearchPanel'));

const TYPING = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

/**
 * Mise en page de la version 1, « Le Codex » : la table (.v1), la barre haute, les huit dos
 * de volumes, le bureau où la vue se pose (PageTurn, colophon), l'étagère du téléphone et
 * le panneau de recherche. Signale au seuil que la première vue est montée.
 */
export function Layout() {
  useSeuilReady();
  const { open: seuilOpen } = useSeuil();
  const [searching, setSearching] = useState(false);
  const openSearch = useCallback(() => setSearching(true), []);
  const closeSearch = useCallback(() => setSearching(false), []);

  // « / » ouvre la recherche, sauf quand le lecteur écrit déjà quelque part.
  useEffect(() => {
    if (seuilOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest(TYPING)) return;
      event.preventDefault();
      setSearching(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [seuilOpen]);

  return (
    <Table>
      <TopBar onSearch={openSearch} />
      <Spines />
      <Desk>
        <Outlet />
      </Desk>
      <Shelf onSearch={openSearch} />
      {searching ? (
        <Suspense fallback={null}>
          <SearchPanel onClose={closeSearch} />
        </Suspense>
      ) : null}
    </Table>
  );
}

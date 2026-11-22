import { useCallback, useMemo } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useVersionPath } from '@/app/version';
import { mapData } from '@/core/content/places';
import { useT } from '@/core/i18n';
import { WorldMap } from '@/shared/map';
import type { MapFrame, WorldMapPlace } from '@/shared/map';

import styles from './CodexMap.module.css';

interface CodexMapProps {
  /** Lieux à poser. `href` : chemin interne sans préfixe (« /lieux/harrenhal ») ou ancre (« #tumbleton »). */
  places: readonly WorldMapPlace[];
  /** Nom accessible de la carte, déjà traduit. */
  title: string;
  frame?: MapFrame;
  selectedId?: string | null;
  highlightIds?: ReadonlySet<string> | null;
  onHover?: (id: string | null) => void;
  showRegions?: boolean;
  /** `plein` : la grande carte des lieux ; `vignette` : une carte de situation. */
  variant?: 'plein' | 'vignette';
  className?: string;
}

/**
 * La carte gravée habillée pour le Codex : encre sur vélin, mer hachurée au bronze, noms en
 * Texturina italique, lieu choisi à l'encre rouge. Les liens passent par le routeur de la
 * version ; une ancre (« #… ») reste un saut dans la page.
 */
export function CodexMap({ places, title, frame, selectedId, highlightIds, onHover, showRegions = true, variant = 'plein', className }: CodexMapProps) {
  const t = useT();
  const path = useVersionPath();
  const navigate = useNavigate();

  const routed = useMemo(
    () => places.map((place) => (place.href && place.href.startsWith('/') ? { ...place, href: path(place.href) } : place)),
    [places, path],
  );
  const targets = useMemo(() => new Map(places.map((place) => [place.id, place.href])), [places]);

  const onActivate = useCallback(
    (id: string, event: ReactMouseEvent<Element>) => {
      const to = targets.get(id);
      if (!to || !to.startsWith('/')) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      navigate(path(to));
    },
    [targets, navigate, path],
  );

  const labels = useMemo(
    () => ({
      title,
      zoomIn: t('page.map.zoomIn'),
      zoomOut: t('page.map.zoomOut'),
      reset: t('page.map.reset'),
      help: t('page.map.help'),
    }),
    [t, title],
  );

  return (
    <div className={`${styles.frame} ${className ?? ''}`} data-variant={variant}>
      <WorldMap
        map={mapData}
        places={routed}
        labels={labels}
        frame={frame}
        selectedId={selectedId}
        highlightIds={highlightIds}
        onActivate={onActivate}
        onHover={onHover}
        showRegions={showRegions}
      />
    </div>
  );
}

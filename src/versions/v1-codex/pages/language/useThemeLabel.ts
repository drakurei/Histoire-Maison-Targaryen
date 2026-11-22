/** Libellé d'un thème du lexique ; un thème que l'interface ne connaît pas encore s'affiche tel quel, capitale en tête. */
import { useCallback } from 'react';

import { uiByKey } from '@/core/content/ui';
import { useT } from '@/core/i18n';

import { themeKey } from './lexiconTools';

export function useThemeLabel(): (theme: string) => string {
  const t = useT();
  return useCallback(
    (theme: string) => {
      const key = themeKey(theme);
      return uiByKey.has(key) ? t(key) : theme.charAt(0).toUpperCase() + theme.slice(1);
    },
    [t],
  );
}

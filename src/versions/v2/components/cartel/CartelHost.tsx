import { lazy, Suspense } from 'react';

import { useT } from '@/core/i18n';

import { useVoir } from '../../state/useVoir';

import { Cartel } from './Cartel';

/** Le contenu du cartel et ses registres ne se chargent qu'à la première ouverture. */
const CartelContenu = lazy(() => import('./CartelContenu'));

/** Lit `?voir=` et pose le cartel : aperçu d'une entité, ou état du royaume. */
export function CartelHost() {
  const t = useT();
  const { voir, close } = useVoir();
  if (!voir) return null;
  return (
    <Cartel label={voir.kind === 'etat' ? t('v2.state.label') : t('v2.cartel.label')} onClose={close}>
      <Suspense fallback={null}>
        <CartelContenu voir={voir} />
      </Suspense>
    </Cartel>
  );
}

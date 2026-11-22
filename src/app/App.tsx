import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { I18nProvider } from '@/core/i18n';
import { SeuilGate } from '@/shared/seuil/SeuilGate';

import { RouteFallback } from './RouteFallback';
import { RouteGuard } from './RouteGuard';
import { AppRoutes } from './routes';
import { ScrollManager } from './ScrollManager';
import { SkipLink } from './SkipLink';

/**
 * Enveloppe de l'application : langues, routeur, lien d'évitement, défilement,
 * garde d'erreur, attente des blocs chargés à la demande. Aucune mise en page :
 * chaque version apporte la sienne.
 */
export function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <SeuilGate>
        <SkipLink />
        <ScrollManager />
        <RouteGuard>
          <Suspense fallback={<RouteFallback />}>
            <AppRoutes />
          </Suspense>
        </RouteGuard>
        </SeuilGate>
      </BrowserRouter>
    </I18nProvider>
  );
}

import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Layout } from './Layout';

/*
 * Point d'entrée de la version 2, « Sable et gueules » (contrat : src/app/routes.tsx).
 * Export par défaut sans props, monté sous « /version-2/* ». Plan complet des routes de
 * ARCHITECTURE.md, en chemins relatifs ; chaque vue est un bloc chargé à la demande depuis
 * pages/<Nom>.tsx (export par défaut). Mise en page commune : Layout.tsx. Les états
 * partageables (année, cartel, filtres) vivent dans la requête : aucune route n'est ajoutée.
 */

const PortalPage = lazy(() => import('./pages/PortalPage'));
const ChroniclesPage = lazy(() => import('./pages/ChroniclesPage'));
const PeriodPage = lazy(() => import('./pages/PeriodPage'));
const EventPage = lazy(() => import('./pages/EventPage'));
const LineagePage = lazy(() => import('./pages/LineagePage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const PersonPage = lazy(() => import('./pages/PersonPage'));
const DragonsPage = lazy(() => import('./pages/DragonsPage'));
const DragonPage = lazy(() => import('./pages/DragonPage'));
const WarsPage = lazy(() => import('./pages/WarsPage'));
const WarPage = lazy(() => import('./pages/WarPage'));
const PlacesPage = lazy(() => import('./pages/PlacesPage'));
const PlacePage = lazy(() => import('./pages/PlacePage'));
const LanguagePage = lazy(() => import('./pages/LanguagePage'));
const LexiconPage = lazy(() => import('./pages/LexiconPage'));
const GrammarPage = lazy(() => import('./pages/GrammarPage'));
const PhrasesPage = lazy(() => import('./pages/PhrasesPage'));
const SourcesPage = lazy(() => import('./pages/SourcesPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const PathPage = lazy(() => import('./pages/PathPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function SableEtGueulesEntry() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PortalPage />} />
        <Route path="chroniques" element={<ChroniclesPage />} />
        <Route path="chroniques/:periodId" element={<PeriodPage />} />
        <Route path="chroniques/:periodId/:eventId" element={<EventPage />} />
        <Route path="lignee" element={<LineagePage />} />
        <Route path="personnages" element={<PeoplePage />} />
        <Route path="personnages/:personId" element={<PersonPage />} />
        <Route path="dragons" element={<DragonsPage />} />
        <Route path="dragons/:dragonId" element={<DragonPage />} />
        <Route path="guerres" element={<WarsPage />} />
        <Route path="guerres/:warId" element={<WarPage />} />
        <Route path="lieux" element={<PlacesPage />} />
        <Route path="lieux/:placeId" element={<PlacePage />} />
        <Route path="langue" element={<LanguagePage />} />
        <Route path="langue/lexique" element={<LexiconPage />} />
        <Route path="langue/grammaire" element={<GrammarPage />} />
        <Route path="langue/expressions" element={<PhrasesPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="apprendre" element={<LearnPage />} />
        <Route path="apprendre/:pathId" element={<PathPage />} />
        <Route path="a-propos" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

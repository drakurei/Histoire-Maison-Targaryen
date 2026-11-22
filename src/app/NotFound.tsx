import { HOME_PATH } from './paths';
import { SystemScreen } from './SystemScreen';
import { UI } from './uiKeys';

/**
 * Page introuvable. Sert à l'enveloppe pour toute adresse hors du plan ; une version
 * peut la reprendre telle quelle pour sa route « * » en attendant la sienne.
 * Le retour mène à la racine, qui redirige vers la version par défaut.
 */
export function NotFound() {
  return (
    <SystemScreen
      kind="introuvable"
      titleKey={UI.notFoundTitle}
      bodyKey={UI.notFoundBody}
      actions={[{ labelKey: UI.portal, to: HOME_PATH }]}
    />
  );
}

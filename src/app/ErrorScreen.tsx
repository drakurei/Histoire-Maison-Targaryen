import { HOME_PATH } from './paths';
import { SystemScreen } from './SystemScreen';
import { UI } from './uiKeys';

function reload(): void {
  window.location.reload();
}

/**
 * Ce que la garde d'erreur affiche : ce qui s'est passé, puis quoi faire.
 * Les deux issues rechargent l'application, pour repartir d'un état sain : « réessayer »
 * recharge la page (un bloc qui n'a pas pu se charger n'est pas redemandé autrement),
 * le portail est un lien dur vers la racine.
 */
export function ErrorScreen() {
  return (
    <SystemScreen
      kind="erreur"
      announce
      titleKey={UI.errorTitle}
      bodyKey={UI.errorBody}
      actions={[
        { labelKey: UI.retry, onAct: reload },
        { labelKey: UI.portal, href: HOME_PATH },
      ]}
    />
  );
}

import { COMPARE_PATH, HOME_PATH } from './paths';
import { SystemScreen } from './SystemScreen';
import { UI } from './uiKeys';
import { useVersion, versionNumber } from './version';

/**
 * Écran provisoire d'une version qui n'est pas encore ouverte. Monté sous son préfixe
 * par src/app/routes.tsx, jusqu'à ce que la version livre son propre point d'entrée.
 */
export default function UnderConstruction() {
  const version = useVersion();

  return (
    <SystemScreen
      kind="construction"
      numeral={String(versionNumber(version))}
      titleKey={UI.underConstruction}
      actions={[
        { labelKey: UI.compareTitle, to: COMPARE_PATH },
        { labelKey: UI.portal, to: HOME_PATH },
      ]}
    />
  );
}

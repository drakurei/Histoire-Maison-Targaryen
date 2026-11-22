import type { Localized } from '@/core/content/types';

import { useTitle, useUi } from './hooks';
import { VALYRIAN_TAG } from './lang';
import type { Vars } from './resolve';

/** Classes ajoutées par une version aux classes de base, élément par élément. */
export interface GlossClasses {
  root?: string;
  /** Première ligne, quelle que soit sa langue. */
  main?: string;
  /** Première ligne quand elle est en valyrien. */
  hv?: string;
  /** Seconde ligne : la traduction dans la langue d'appui. */
  tr?: string;
}

interface GlossCommonProps {
  /** Classe ajoutée à l'élément racine. */
  className?: string;
  classes?: GlossClasses;
}

interface GlossKeyProps extends GlossCommonProps {
  /** Clé d'une chaîne d'interface (`content/interface/ui.json`). */
  k: string;
  vars?: Vars;
  text?: never;
}

interface GlossTextProps extends GlossCommonProps {
  /** Titre de contenu, qui peut porter une forme valyrienne. */
  text: Localized;
  k?: never;
  vars?: never;
}

export type GlossProps = GlossKeyProps | GlossTextProps;

function join(...names: (string | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

/**
 * La glose interlinéaire, sans aucun style : chaque version l'habille.
 *
 * En valyrien :
 *   span.gloss.gloss--hv[data-status]
 *     > span.gloss__main.gloss__hv[lang="art-x-valyrian"]
 *     + span.gloss__tr
 * En français ou en anglais, ou sans forme valyrienne :
 *   span.gloss.gloss--plain > span.gloss__main
 *
 * `data-status` porte le statut de la forme (atteste, derive, editorial, adaptation)
 * quand il est connu. L'espace entre les deux lignes sépare les mots pour la copie
 * et pour la lecture d'écran ; il disparaît dès que les lignes sont en bloc.
 */
export function Gloss(props: GlossProps) {
  const ui = useUi();
  const title = useTitle();
  const { className, classes } = props;

  if (props.k !== undefined) {
    const { primary, gloss, status, isHv } = ui(props.k, props.vars);
    return renderGloss({ primary, gloss, status, isHv, className, classes });
  }
  const { primary, gloss, isHv } = title(props.text);
  return renderGloss({ primary, gloss, isHv, className, classes });
}

interface GlossLines extends GlossCommonProps {
  primary: string;
  gloss?: string;
  status?: string;
  isHv: boolean;
}

function renderGloss({ primary, gloss, status, isHv, className, classes }: GlossLines) {
  if (!isHv) {
    return (
      <span className={join('gloss', 'gloss--plain', className, classes?.root)}>
        <span className={join('gloss__main', classes?.main)}>{primary}</span>
      </span>
    );
  }
  return (
    <span className={join('gloss', 'gloss--hv', className, classes?.root)} data-status={status}>
      <span className={join('gloss__main', 'gloss__hv', classes?.main, classes?.hv)} lang={VALYRIAN_TAG}>
        {primary}
      </span>
      {gloss ? (
        <>
          {' '}
          <span className={join('gloss__tr', classes?.tr)}>{gloss}</span>
        </>
      ) : null}
    </span>
  );
}

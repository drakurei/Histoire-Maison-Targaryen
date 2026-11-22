import type { ReactNode } from 'react';

import type { Localized } from '@/core/content/types';
import { Gloss } from '@/core/i18n';
import type { Vars } from '@/core/i18n';

import styles from './Rubric.module.css';

interface RubricBase {
  /** Niveau du titre. Un seul `h1` par vue. */
  as?: 'h1' | 'h2' | 'h3';
  /** `monumental` (--t5, ouverture de page), `titre` (--t4, défaut du h1), `section` (--t2, défaut du h2), `sous` (--t1). */
  size?: 'monumental' | 'titre' | 'section' | 'sous';
  id?: string;
  className?: string;
}

type RubricProps = RubricBase &
  (
    | { k: string; vars?: Vars; text?: never; children?: never }
    | { text: Localized; k?: never; vars?: never; children?: never }
    | { children: ReactNode; k?: never; vars?: never; text?: never }
  );

const DEFAULT_SIZE = { h1: 'titre', h2: 'section', h3: 'sous' } as const;

/**
 * Rubric : le titre rubriqué, à l'encre rouge comme dans un manuscrit, avec sa glose
 * interlinéaire quand la première ligne est en valyrien. Une clé d'interface (`k`), un
 * titre de contenu (`text`) ou des enfants déjà composés.
 */
export function Rubric(props: RubricProps) {
  const { as: Tag = 'h2', id, className } = props;
  const size = props.size ?? DEFAULT_SIZE[Tag];
  const classes = { main: styles.main, tr: styles.tr };

  let content: ReactNode;
  if (props.k !== undefined) content = <Gloss k={props.k} vars={props.vars} classes={classes} />;
  else if (props.text !== undefined) content = <Gloss text={props.text} classes={classes} />;
  else content = props.children;

  return (
    <Tag id={id} className={`${styles.rubric} ${className ?? ''}`} data-size={size}>
      {content}
    </Tag>
  );
}

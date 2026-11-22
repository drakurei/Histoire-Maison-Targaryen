import { useEffect, useMemo, useRef } from 'react';

import { mainThread } from '@/core/content/people';
import type { Person, SupportLang } from '@/core/content/types';
import { layoutThread } from '@/core/genealogy';
import { useT } from '@/core/i18n';

import { useElementWidth } from '../../components/hooks';
import { graph, shortName } from './model';
import { TreeDrawing } from './TreeDrawing';
import styles from './ThreadView.module.css';

interface ThreadViewProps {
  reading: SupportLang;
  selected: string | null;
  showLoops: boolean;
  onSelect: (id: string) => void;
  describe: (person: Person) => string;
}

/** Corps et chasse moyenne des noms d'enfants dans l'éventail (Alegreya, 11,5 px). */
const CHILD_TEXT = 11.5;
const CHILD_CHAR = 0.5;

/**
 * Le fil vertical du téléphone : la filiation directe d'Aenar à Daenerys, un maillon par
 * génération, conjoints à droite et enfants en éventail sous chacun. On le lit en faisant
 * défiler la page, comme une colonne de chronique.
 */
export function ThreadView({ reading, selected, showLoops, onSelect, describe }: ThreadViewProps) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box);

  const thread = useMemo(() => {
    if (width < 240) return null;
    return layoutThread(graph, mainThread, {
      width,
      padding: 4,
      mainWidth: Math.min(150, Math.round(width * 0.36)),
      mainHeight: 48,
      partnerHeight: 40,
      childHeight: 32,
      childMinWidth: 74,
      wideChild: (person, childWidth) => shortName(person, reading).length * CHILD_TEXT * CHILD_CHAR > childWidth - 8,
    });
  }, [reading, width]);

  const drawing = useMemo(() => (thread ? { ...thread, width, height: thread.bounds.height } : null), [thread, width]);
  const roles = useMemo(() => new Map(thread?.nodes.map((node) => [node.id, node.role]) ?? []), [thread]);

  // Une personne demandée par l'adresse est amenée sous les yeux.
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || !thread || !selected) return;
    scrolled.current = true;
    // Dans le tiers haut de l'écran : le feuillet de parenté occupe le bas.
    const element = box.current?.querySelector(`[data-person="${CSS.escape(selected)}"]`);
    if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.18 });
  }, [selected, thread]);

  return (
    <div ref={box} className={styles.thread} role="group" aria-label={t('page.lignee.thread.label')}>
      {thread && drawing ? (
        <svg className={styles.svg} width={width} height={thread.bounds.height} viewBox={`0 0 ${width} ${thread.bounds.height}`}>
          <TreeDrawing
            drawing={drawing}
            reading={reading}
            selected={selected}
            showLoops={showLoops}
            scale="thread"
            roles={roles}
            onActivate={onSelect}
            describe={describe}
          />
        </svg>
      ) : null}
    </div>
  );
}

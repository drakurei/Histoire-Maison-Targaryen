import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { layoutTree } from '@/core/genealogy';
import type { LayoutResult } from '@/core/genealogy';
import { formatSpan, Gloss, useLang, useT, useTitle } from '@/core/i18n';

import { useLienHref } from '../../state/links';

import styles from './ArbreEntier.module.css';
import { graph, lifeBounds, threadIds } from './donnees';
import { nomCourt } from './nomCourt';
import { useTelephone } from './useEcran';
import { useEtatAnnee } from './useEtatAnnee';

/**
 * L'arbre entier : `layoutTree` coûte 300 à 480 ms sur le navigateur. Il est calculé une fois
 * par visite, à la première ouverture, hors du premier rendu, et gardé au niveau du module.
 */
let cachedLayout: LayoutResult | null = null;

function computeLayout(): LayoutResult {
  cachedLayout ??= layoutTree(graph, { nodeWidth: 136, nodeHeight: 44 });
  return cachedLayout;
}

interface Vue {
  x: number;
  y: number;
  k: number;
}

const MIN_K = 0.25;
const MAX_K = 2.2;

function points(list: readonly { x: number; y: number }[]): string {
  return list.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join('');
}

interface ArbreEntierProps {
  /** Personne au centre du fil : l'arbre s'ouvre sur elle. */
  centre: string;
  year: number | null;
  /** Adresse (sans préfixe) qui revient au pal centré sur une personne. */
  recentre: (id: string) => string;
  /** Revenir au fil (fermeture de la feuille au téléphone). */
  onClose: () => void;
}

/**
 * L'arbre entier (`?vue=arbre`, champ plein, spec §5.7) : `layoutTree` en SVG, déplacement au
 * glisser, zoom au pincement et aux touches + et −, unions consanguines en anneaux de sang, le
 * fil en sang. Choisir un nom revient au pal centré sur lui. Au téléphone, plein écran dans
 * un `dialog`.
 */
export function ArbreEntier({ centre, year, recentre, onClose }: ArbreEntierProps) {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const etatAnnee = useEtatAnnee();
  const navigate = useNavigate();
  const href = useLienHref();
  const [layout, setLayout] = useState<LayoutResult | null>(cachedLayout);
  const stage = useRef<HTMLDivElement>(null);
  const group = useRef<SVGGElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const view = useRef<Vue>({ x: 0, y: 0, k: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: number; distance: number | null }>({ moved: 0, distance: null });
  const phone = useTelephone();

  useEffect(() => {
    if (layout) return;
    // Laisse la page se peindre avant le calcul.
    const timer = window.setTimeout(() => setLayout(computeLayout()), 40);
    return () => window.clearTimeout(timer);
  }, [layout]);

  useEffect(() => {
    const node = dialog.current;
    if (!phone || !node || node.open) return;
    node.showModal();
    const cancel = () => onClose();
    node.addEventListener('close', cancel);
    return () => node.removeEventListener('close', cancel);
  }, [phone, onClose]);

  const unionById = useMemo(() => new Map((layout?.unions ?? []).map((union) => [union.id, union])), [layout]);

  const apply = useCallback(() => {
    const { x, y, k } = view.current;
    group.current?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(3)})`);
  }, []);

  const centreOn = useCallback(
    (id: string, k?: number) => {
      const box = stage.current?.getBoundingClientRect();
      const node = layout?.nodes.find((entry) => entry.id === id);
      if (!box || !node) return;
      const scale = k ?? view.current.k;
      view.current = { k: scale, x: box.width / 2 - (node.x + node.w / 2) * scale, y: box.height * 0.4 - (node.y + node.h / 2) * scale };
      apply();
    },
    [layout, apply],
  );

  useLayoutEffect(() => {
    if (layout) centreOn(centre, phone ? 0.85 : 1);
  }, [layout, centre, phone, centreOn]);

  const zoom = useCallback(
    (factor: number, at?: { x: number; y: number }) => {
      const box = stage.current?.getBoundingClientRect();
      if (!box) return;
      const origin = at ?? { x: box.width / 2, y: box.height / 2 };
      const { x, y, k } = view.current;
      const next = Math.min(MAX_K, Math.max(MIN_K, k * factor));
      view.current = { k: next, x: origin.x - ((origin.x - x) / k) * next, y: origin.y - ((origin.y - y) / k) * next };
      apply();
    },
    [apply],
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gesture.current = { moved: 0, distance: null };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const current = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, current);
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const box = stage.current?.getBoundingClientRect();
      if (gesture.current.distance && box) {
        zoom(distance / gesture.current.distance, { x: (a.x + b.x) / 2 - box.left, y: (a.y + b.y) / 2 - box.top });
      }
      gesture.current.distance = distance;
      gesture.current.moved += 10;
      return;
    }
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    gesture.current.moved += Math.abs(dx) + Math.abs(dy);
    view.current = { ...view.current, x: view.current.x + dx, y: view.current.y + dy };
    apply();
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) gesture.current.distance = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = 60;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (event.key === '+' || event.key === '=') zoom(1.25);
    else if (event.key === '-' || event.key === '−') zoom(0.8);
    else if (event.key === '0') centreOn(centre, 1);
    else if (moves[event.key]) {
      const [dx, dy] = moves[event.key] ?? [0, 0];
      view.current = { ...view.current, x: view.current.x + dx, y: view.current.y + dy };
      apply();
    } else return;
    event.preventDefault();
  };

  const choose = (event: MouseEvent<Element>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (gesture.current.moved > 6) return;
    navigate(href(recentre(id)));
  };

  const contenu = (
    <div className={styles.arbre}>
      <div className={styles.commandes}>
        <p className={styles.aide}>{t('v2.lineage.tree_hint')}</p>
        <div className={styles.boutons}>
          <button type="button" className={styles.bouton} onClick={() => zoom(1.25)}>
            {t('page.lignee.zoom.in')}
          </button>
          <button type="button" className={styles.bouton} onClick={() => zoom(0.8)}>
            {t('page.lignee.zoom.out')}
          </button>
          <button type="button" className={styles.bouton} onClick={() => centreOn(centre, 1)}>
            {t('page.lignee.zoom.recenter')}
          </button>
          <button type="button" className={styles.bouton} onClick={onClose}>
            {phone ? <Gloss k="action.close" /> : t('v2.lineage.back_to_line')}
          </button>
        </div>
      </div>
      <div
        ref={stage}
        className={styles.scene}
        tabIndex={0}
        role="group"
        aria-label={t('page.lignee.stage.label')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {layout ? (
          <svg className={styles.svg} width="100%" height="100%">
            <g ref={group}>
              {layout.links.map((link) => {
                const union = link.fromKind === 'union' ? unionById.get(link.from) : undefined;
                const fil = threadIds.has(link.to) && (link.fromKind === 'person' ? threadIds.has(link.from) : union ? threadIds.has(union.a) || threadIds.has(union.b) : false);
                return (
                  <path
                    key={`${link.from}>${link.to}`}
                    className={fil ? styles.fil : styles.lienFiliation}
                    data-doute={link.certainty && link.certainty !== 'etabli' ? '' : undefined}
                    d={points(link.points)}
                  />
                );
              })}
              {layout.unions.map((union) => (
                <g key={union.id}>
                  {union.ties.map((tie) => (
                    <path key={tie.person} className={styles.attache} d={points(tie.points)} />
                  ))}
                  <circle className={union.consanguineous ? styles.anneauSang : styles.anneau} cx={union.x} cy={union.y} r={union.consanguineous ? 5 : 4} />
                </g>
              ))}
              {layout.nodes.map((node) => {
                const person = graph.personById.get(node.id);
                if (!person) return null;
                const court = nomCourt(person, title(person.name).primary);
                const { born, died } = lifeBounds(person);
                const etat = etatAnnee(person, year).etat;
                const alliance = (graph.parentIds.get(person.id)?.length ?? 0) === 0 && person.generation > 0;
                return (
                  <a
                    key={node.id}
                    href={href(recentre(node.id))}
                    className={styles.noeud}
                    data-etat={etat}
                    data-centre={node.id === centre ? '' : undefined}
                    data-fil={threadIds.has(node.id) ? '' : undefined}
                    data-alliance={alliance ? '' : undefined}
                    onClick={(event) => choose(event, node.id)}
                  >
                    <title>{title(person.name).primary}</title>
                    <rect className={styles.cible} x={node.x} y={node.y} width={node.w} height={node.h} />
                    <text className={styles.nom} x={node.x + node.w / 2} y={node.y + 19}>
                      {court.nom}
                    </text>
                    <text className={styles.annees} x={node.x + node.w / 2} y={node.y + 35}>
                      {born === null && died === null ? '' : formatSpan(born, died, reading)}
                    </text>
                    {node.id === centre ? (
                      <line className={styles.souligne} x1={node.x + 18} x2={node.x + node.w - 18} y1={node.y + 24} y2={node.y + 24} />
                    ) : null}
                  </a>
                );
              })}
            </g>
          </svg>
        ) : (
          <p className={styles.attente}><Gloss k="phrase.loading" /></p>
        )}
      </div>
    </div>
  );

  if (phone) {
    return (
      <dialog ref={dialog} className={styles.feuille} aria-label={t('page.lignee.mode.tree')}>
        {contenu}
      </dialog>
    );
  }
  return contenu;
}

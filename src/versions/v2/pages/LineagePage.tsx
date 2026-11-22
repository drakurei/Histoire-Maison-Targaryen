import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { kinship } from '@/core/genealogy';
import { useT } from '@/core/i18n';

import { Lien } from '../components/Lien';
import { Page } from '../components/Page';
import { Titre } from '../components/Titre';
import { reignsAt } from '../model/presence';
import { useFasce } from '../state/fasce';
import { useYear } from '../state/year';

import { ArbreEntier } from './lignee/ArbreEntier';
import { graph, lifeBounds, maxGeneration, persons, sovereignById, sovereigns, threadByGeneration, threadRank } from './lignee/donnees';
import { LienParente } from './lignee/LienParente';
import { LigneAnnee } from './lignee/LigneAnnee';
import { modelePal } from './lignee/modelePal';
import { Pal } from './lignee/Pal';
import { useTelephone } from './lignee/useEcran';
import styles from './LineagePage.module.css';

const FOUNDER = 'aegon-i';
const NO_PATH: ReadonlySet<string> = new Set();

/** Une année qui parle pour une personne : le début de son règne, sinon le milieu de sa vie. */
function suggestYear(id: string): number | null {
  const sovereign = sovereignById.get(id);
  if (sovereign) return sovereign.reignFrom;
  const person = graph.personById.get(id);
  if (!person) return null;
  const { born, died } = lifeBounds(person);
  if (born !== null && died !== null) return Math.round((born + died) / 2) || 1;
  return born ?? died;
}

/**
 * Lignée `/lignee` (pal, spec §5.7). Le pal descend toute la page : le fil de filiation, une
 * personne par génération ; au centre (`?p=`, par défaut le souverain de l'année réglée, sinon
 * Aegon Ier), ses grands-parents, ses parents, ses unions, sa fratrie et ses enfants. À droite,
 * le lien de parenté (`?avec=`). L'arbre entier (`?vue=arbre`) prend tout le champ, ou tout
 * l'écran au téléphone.
 */
export default function LineagePage() {
  const t = useT();
  const year = useYear();
  const phone = useTelephone();
  const [params, setParams] = useSearchParams();
  const asked = params.get('p');
  const avecParam = params.get('avec');
  const tree = params.get('vue') === 'arbre';

  const fallback = useMemo(() => (year === null ? FOUNDER : (reignsAt(sovereigns, year)[0]?.id ?? FOUNDER)), [year]);
  const centreId = asked && graph.personById.has(asked) ? asked : fallback;
  const avec = avecParam && graph.personById.has(avecParam) ? avecParam : null;

  const modele = useMemo(() => modelePal(graph, centreId, threadByGeneration, threadRank), [centreId]);
  const chemin = useMemo(() => (avec && avec !== centreId ? new Set(kinship(graph, centreId, avec).line) : NO_PATH), [avec, centreId]);

  const recentre = useCallback(
    (id: string) => {
      const query = new URLSearchParams({ p: id });
      if (avec && avec !== id) query.set('avec', avec);
      return `/lignee?${query.toString()}`;
    },
    [avec],
  );

  const write = useCallback(
    (change: (copy: URLSearchParams) => void, replace: boolean) => {
      const copy = new URLSearchParams(params);
      change(copy);
      setParams(copy, { replace, preventScrollReset: true });
    },
    [params, setParams],
  );

  const onA = useCallback((id: string) => write((copy) => copy.set('p', id), false), [write]);
  const onB = useCallback(
    (id: string | null) =>
      write((copy) => {
        if (id) copy.set('avec', id);
        else copy.delete('avec');
      }, true),
    [write],
  );
  const closeTree = useCallback(() => write((copy) => copy.delete('vue'), false), [write]);

  // La fasce tient la vie de la personne au centre.
  const centre = modele?.centre;
  const bounds = centre ? lifeBounds(centre) : { born: null, died: null };
  const end = bounds.died ?? (centre?.alive ? 300 : null);
  const sovereign = centre ? sovereignById.get(centre.id) : undefined;
  useFasce({
    span: bounds.born !== null && end !== null ? [bounds.born, end] : null,
    reign: sovereign ? [sovereign.reignFrom, sovereign.reignTo] : null,
  });

  if (!modele) return null;

  const treeLink = (
    <Lien to={`/lignee?p=${centreId}&vue=arbre`} className={styles.arbreLien}>
      {t('page.lignee.mode.tree')}
    </Lien>
  );

  if (tree && !phone) {
    return (
      <Page partition="champ" className={styles.page}>
        <Titre k="nav.genealogy" className={styles.titreArbre} />
        <ArbreEntier centre={centreId} year={year} recentre={recentre} onClose={closeTree} />
      </Page>
    );
  }

  return (
    <Page partition="pal" className={styles.page}>
      <Titre k="nav.genealogy" className={styles.titre}>
        <p className={styles.intro}>{t('page.lignee.intro', { n: persons.length, generations: maxGeneration + 1 })}</p>
        <p className={styles.mode}>
          <span>{t('v2.lineage.how')}</span>
          {treeLink}
        </p>
      </Titre>
      <div className={styles.fil}>
        <Pal modele={modele} year={year} chemin={chemin} recentre={recentre} revelerAuDebut={asked !== null} />
        <div className={styles.annee}>
          <LigneAnnee year={year} suggestion={suggestYear(centreId)} />
        </div>
      </div>
      <aside className={styles.lien}>
        <LienParente a={centreId} b={avec} onA={onA} onB={onB} recentre={recentre} />
      </aside>
      {tree && phone ? <ArbreEntier centre={centreId} year={year} recentre={recentre} onClose={closeTree} /> : null}
    </Page>
  );
}

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { kinship } from '@/core/genealogy';
import { useT } from '@/core/i18n';
import { col } from '@/versions/v1-codex/components/grid';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { Lien } from '@/versions/v2/components/Lien';
import { reignsAt } from '@/versions/v2/model/presence';
import { ArbreEntier } from '@/versions/v2/pages/lignee/ArbreEntier';
import { graph, lifeBounds, maxGeneration, persons, sovereignById, sovereigns, threadByGeneration, threadRank } from '@/versions/v2/pages/lignee/donnees';
import { LienParente } from '@/versions/v2/pages/lignee/LienParente';
import { LigneAnnee } from '@/versions/v2/pages/lignee/LigneAnnee';
import { modelePal } from '@/versions/v2/pages/lignee/modelePal';
import { useYear } from '@/versions/v2/state/year';

import { Feuillet } from '../components/common/Feuillet';
import { TitreChamp } from '../components/common/TitreChamp';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import { Pal3 } from './lignee/Pal3';
import { Rouleau } from './lignee/Rouleau';
import styles from './LineagePage.module.css';

const FOUNDER = 'aegon-i';
/** Rangées gardées au-dessus du centre quand les plus anciennes sont repliées : celle des parents. */
const AU_DESSUS = 1;
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
 * Lignée `/lignee` de la V3 (v3-spec §6.5, pal sur le champ). Le pal de la V2 (fil de
 * filiation, centre `?p=`, âges à l'année, anneaux du sang) avec la couronne lisible et sans
 * ordinal ; le lien de parenté (`?avec=`) en colonnes 9 à 12. L'arbre entier (`?vue=arbre`)
 * se pose sur un folio pleine largeur, le rouleau à l'encre de la V1 ; au téléphone, l'arbre
 * plein écran de la V2.
 */
export default function LineagePage() {
  const t = useT();
  const year = useYear();
  const desktop = useMedia(DESKTOP);
  const [params, setParams] = useSearchParams();
  const asked = params.get('p');
  const avecParam = params.get('avec');
  const tree = params.get('vue') === 'arbre';

  const fallback = useMemo(() => (year === null ? FOUNDER : (reignsAt(sovereigns, year)[0]?.id ?? FOUNDER)), [year]);
  const centreId = asked && graph.personById.has(asked) ? asked : fallback;
  const avec = avecParam && graph.personById.has(avecParam) ? avecParam : null;

  const modele = useMemo(() => modelePal(graph, centreId, threadByGeneration, threadRank), [centreId]);
  // Les générations les plus anciennes du fil se replient : le centre et le lien tiennent
  // dans le premier écran (v3-spec §6.5). Le dépli vaut pour un centre ; un autre centre replie.
  const [deplie, setDeplie] = useState<string | null>(null);
  const rangeeCentre = modele ? modele.rangees.findIndex((rangee) => rangee.lignes.some((ligne) => ligne.kind === 'centre')) : -1;
  const caches = deplie === centreId || rangeeCentre < 0 ? 0 : Math.max(0, rangeeCentre - AU_DESSUS);
  const visible = useMemo(() => (modele && caches > 0 ? { ...modele, rangees: modele.rangees.slice(caches) } : modele), [modele, caches]);
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
  const pickInTree = useCallback(
    (id: string) =>
      write((copy) => {
        copy.set('p', id);
        copy.delete('vue');
      }, false),
    [write],
  );

  // La fasce tient la vie de la personne au centre, son règne en or.
  const centre = modele?.centre;
  const bounds = centre ? lifeBounds(centre) : { born: null, died: null };
  const end = bounds.died ?? (centre?.alive ? 300 : null);
  const sovereign = centre ? sovereignById.get(centre.id) : undefined;
  useVue({
    span: bounds.born !== null && end !== null ? [bounds.born, end] : null,
    reign: sovereign ? [sovereign.reignFrom, sovereign.reignTo] : null,
  });

  if (!modele || !visible) return null;

  const compte = t('v3.lignee.compte', { n: persons.length, generations: maxGeneration + 1 });

  if (tree && desktop) {
    return (
      <Vue partition="champ" className={styles.vue}>
        <Feuillet wide labelledBy="v3-lignee-arbre">
          <header className={`${col.pleine} ${styles.arbreTete}`}>
            <Rubric as="h1" id="v3-lignee-arbre" k="nav.genealogy" size="section" />
            <p className={styles.arbreCompte}>{compte}</p>
            <p className={styles.arbreRetour}>
              <Lien to={recentre(centreId)} className={styles.lienVelin}>
                {t('v3.lignee.retour_pal')}
              </Lien>
            </p>
          </header>
          <Rouleau centre={centreId} onPick={pickInTree} />
        </Feuillet>
      </Vue>
    );
  }

  return (
    <Vue partition="pal" className={styles.vue}>
      <TitreChamp k="nav.genealogy" className={styles.titre}>
        <p className={styles.compte}>
          <span>{compte}</span>
          <Lien to={`/lignee?p=${centreId}&vue=arbre`} className={styles.arbreLien}>
            {t('page.lignee.mode.tree')}
          </Lien>
        </p>
        <p className={styles.mode}>{t('v3.lignee.how')}</p>
      </TitreChamp>
      <div className={styles.fil}>
        {caches > 0 ? (
          <p className={styles.repli}>
            <button type="button" className={styles.deplier} aria-expanded={false} onClick={() => setDeplie(centreId)}>
              {t('v3.lignee.deplier', { n: caches })}
            </button>
          </p>
        ) : null}
        <Pal3 modele={visible} year={year} chemin={chemin} recentre={recentre} revelerAuDebut={asked !== null} />
        <div className={styles.annee}>
          <LigneAnnee year={year} suggestion={suggestYear(centreId)} />
        </div>
      </div>
      <aside className={styles.lien} aria-label={t('v3.lignee.lien_label')}>
        <LienParente a={centreId} b={avec} onA={onA} onB={onB} recentre={recentre} />
      </aside>
      {tree && !desktop ? <ArbreEntier centre={centreId} year={year} recentre={recentre} onClose={closeTree} /> : null}
    </Vue>
  );
}

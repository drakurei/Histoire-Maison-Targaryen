import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { VLink } from '@/app/version';
import { dragons, getDragon, getExtraTextualNote, getLookNote } from '@/core/content/dragons';
import { events, periods } from '@/core/content/timeline';
import type { Battle, Dragon } from '@/core/content/types';
import { getBattle, getWar } from '@/core/content/wars';
import { formatYear, useLang, useT, useTitle, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { Figure } from '@/versions/v1-codex/components/Figure';
import { col } from '@/versions/v1-codex/components/grid';
import { Prose } from '@/versions/v1-codex/components/Prose';
import { ReliabilityMark } from '@/versions/v1-codex/components/ReliabilityMark';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { SourceList } from '@/versions/v1-codex/components/SourceList';
import { useDragonYears } from '@/versions/v1-codex/pages/dragons/DragonRow';
import { Plate } from '@/versions/v1-codex/pages/dragons/Plate';
import { dragonEpochs, dragonName, neighbours } from '@/versions/v1-codex/pages/dragons/registry';
import { Ombre } from '@/versions/v2/components/Ombre';
import { dragonInBattle, dragonYears } from '@/versions/v2/pages/registres/appearances';
import { lifeOf } from '@/versions/v2/pages/registres/dragonLife';
import { ghostFor, rememberPlate } from '@/versions/v2/pages/registres/ghost';
import type { Ghost } from '@/versions/v2/pages/registres/ghost';

import { Colonne } from '../components/common/Colonne';
import { Feuillet } from '../components/common/Feuillet';
import { Nom } from '../components/common/Nom';
import { Parti3 } from '../components/common/Parti3';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import NotFoundPage from './NotFoundPage';
import { Echelle } from './registres/Echelle';
import { LieuxDuDragon } from './registres/LieuxDuDragon';
import { Cavaliers } from './registres/Cavaliers';
import styles from './DragonPage.module.css';

const PARTS = ['body', 'wing', 'crest', 'flame'] as const;

/**
 * Planche `/dragons/:dragonId` (v3-spec §6.9, parti). Le folio de vélin porte la planche
 * annotée de la V1 entière au premier écran (silhouette, appels, teintes décrites ou non,
 * « voir voler »), puis la robe, l'origine, les batailles et le sort du dragon dans chacune,
 * son sort, ce que l'adaptation change à part, les sources en marge. La colonne du champ
 * porte l'échelle comparée (ce dragon, le fantôme du précédent, un homme debout), les
 * cavaliers sur la vie, et les lieux où il paraît. Aucun grand nombre.
 */
export default function DragonPage() {
  const { dragonId = '' } = useParams();
  const dragon = getDragon(dragonId);
  if (!dragon) return <NotFoundPage />;
  return <Planche key={dragon.id} dragon={dragon} />;
}

function Planche({ dragon }: { dragon: Dragon }) {
  const t = useT();
  const tx = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const years = useDragonYears();
  const desktop = useMedia(DESKTOP);
  const life = lifeOf(dragon.id);
  useVue({ span: life ? [life.from, life.to] : null });

  // Le fantôme se lit une fois, à l'arrivée : la planche vue juste avant, sinon Balerion.
  const [ghost] = useState<Ghost | null>(() => ghostFor(dragon.id));
  useEffect(() => rememberPlate(dragon.id), [dragon.id]);

  const order = useMemo(() => dragonEpochs(dragons, periods, events).flatMap((epoch) => epoch.dragons), []);
  const lived = useMemo(() => dragonYears(dragon), [dragon]);
  const { previous, next } = neighbours(order, dragon.id);

  const name = title(dragonName(dragon));
  const lookNote = getLookNote(dragon.id);
  const extra = getExtraTextualNote(dragon.id);
  const look = dragon.look.attested;
  const described = PARTS.filter((part) => look[part]).map((part) => t(`page.dragon.part.${part}`).toLowerCase());
  const bare = PARTS.filter((part) => !look[part]).map((part) => t(`page.dragon.part.${part}`).toLowerCase());
  const battles = dragon.battleIds
    .map((id) => getBattle(id))
    .filter((battle): battle is Battle => battle !== undefined)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  const titreId = `planche-${dragon.id}`;

  const tete = (
    <>
      <header className={`${col.pleine} ${styles.tete}`}>
        <Rubric as="h1" id={titreId} text={dragonName(dragon)} className={name.gloss === name.primary ? styles.sansGlose : undefined} />
        <div className={styles.meta}>
          {dragon.alias ? <p className={styles.alias}>{tx(dragon.alias)}</p> : null}
          <p className={styles.faits}>
            <span className={styles.annees}>{years(dragon)}</span>
            <ReliabilityMark level={dragon.reliability} />
          </p>
        </div>
      </header>
      <Figure className={`${col.pleine} ${styles.planche}`} caption={t('page.dragon.plate.caption')}>
        <Plate dragon={dragon} name={name.primary} colorNote={lookNote?.color} />
      </Figure>
    </>
  );

  const folio = (
    <>
      <section className={`${col.rangee} ${styles.section}`} aria-labelledby={`${titreId}-robe`}>
        <div className={col.recit}>
          <Rubric as="h2" id={`${titreId}-robe`} k="page.dragon.appearance.heading" />
          {dragon.appearance ? <Prose text={dragon.appearance} lettrine={tx(dragon.appearance).length > 240} /> : <p className={styles.phrase}>{t('page.dragon.appearance.none')}</p>}
          <p className={styles.appareil}>
            {described.length > 0 ? <span>{t('v2.dragon.colours_described', { parts: described.join(', ') })}</span> : null}
            {bare.length > 0 ? <span>{t('v2.dragon.colours_not_described', { parts: bare.join(', ') })}</span> : null}
          </p>
          {extra ? (
            <div className={styles.horsLivres}>
              <p className={styles.appareil}>{t('page.dragon.extra')}</p>
              <Prose text={extra} />
            </div>
          ) : null}
        </div>
        <aside className={`${col.marge} ${styles.marge}`} aria-label={t('label.sources')}>
          {lookNote?.size ? <p className={styles.note}>{tx(lookNote.size)}</p> : null}
          <p className={styles.margeTitre}>{t('label.sources')}</p>
          <SourceList sources={dragon.sources} />
        </aside>
      </section>

      <section className={`${col.rangee} ${styles.section}`} aria-labelledby={`${titreId}-origine`}>
        <div className={col.recit}>
          <Rubric as="h2" id={`${titreId}-origine`} k="page.dragon.origin.heading" />
          <Prose text={dragon.origin} />
        </div>
        {dragon.ridersNote ? (
          <aside className={`${col.marge} ${styles.marge}`}>
            <p className={styles.note}>{tx(dragon.ridersNote)}</p>
          </aside>
        ) : null}
      </section>

      <section className={`${col.recit} ${styles.section}`} aria-labelledby={`${titreId}-batailles`}>
        <Rubric as="h2" id={`${titreId}-batailles`} k="page.dragon.battles.heading" />
        {battles.length === 0 ? (
          <p className={styles.phrase}>{t('v2.dragon.no_battles')}</p>
        ) : (
          <ol className={styles.batailles} role="list">
            {battles.map((battle) => {
              const war = getWar(battle.warId);
              const engaged = dragonInBattle(battle, dragon.id);
              return (
                <li key={battle.id} className={styles.bataille}>
                  <span className={styles.batailleAn}>{formatYear(battle.year, reading)}</span>
                  <div className={styles.batailleCorps}>
                    <h3 className={styles.batailleNom}>
                      <Nom kind="battle" id={battle.id} name={battle.name} />
                    </h3>
                    {war ? (
                      <p className={styles.batailleGuerre}>
                        <Nom kind="war" id={war.id} name={war.title} />
                      </p>
                    ) : null}
                    {engaged ? <p className={styles.sort}>{tx(engaged.fate)}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className={`${col.recit} ${styles.section}`} aria-labelledby={`${titreId}-sort`}>
        <Rubric as="h2" id={`${titreId}-sort`} k="page.dragon.fate.heading" />
        <Prose text={dragon.fate} />
      </section>

      {dragon.adaptationNote ? (
        <section className={`${col.recit} ${styles.adaptation}`} aria-labelledby={`${titreId}-adaptation`}>
          <Rubric as="h2" id={`${titreId}-adaptation`} k="page.dragon.adaptation.heading" size="sous" />
          <p className={styles.continuite}>
            <ReliabilityMark level="adaptation" />
          </p>
          <Prose text={dragon.adaptationNote} />
        </section>
      ) : null}

      <nav className={`${col.pleine} ${styles.pager}`} aria-label={t('page.dragon.pager')}>
        {previous ? (
          <VLink to={`/dragons/${previous.id}`} className={styles.pagerLien} rel="prev">
            <span className={styles.pagerSens}>{t('page.dragon.previous')}</span>
            <NomPlanche dragon={previous} />
          </VLink>
        ) : (
          <span />
        )}
        <VLink to="/dragons" className={styles.pagerRetour}>
          {t('page.dragon.back')}
        </VLink>
        {next ? (
          <VLink to={`/dragons/${next.id}`} className={`${styles.pagerLien} ${styles.pagerSuivant}`} rel="next">
            <span className={styles.pagerSens}>{t('page.dragon.next')}</span>
            <NomPlanche dragon={next} />
          </VLink>
        ) : (
          <span />
        )}
      </nav>
    </>
  );

  const echelle = <Echelle dragon={dragon} ghost={ghost} name={name.primary} />;
  const cavaliers = <Cavaliers dragon={dragon} life={life} years={lived} />;
  const lieux = <LieuxDuDragon dragon={dragon} name={name.primary} />;

  if (desktop) {
    return (
      <Vue partition="parti">
        <Parti3
          labelledBy={titreId}
          tete={tete}
          folio={folio}
          colonne={
            <Colonne
              label={t('v3.registres.planche.colonne')}
              figure={
                <div className={styles.pileColonne}>
                  {echelle}
                  {cavaliers}
                  {lieux}
                </div>
              }
            />
          }
        />
        <Ombre once={`ombre:v3:dragon:${dragon.id}`} look={dragon.look} />
      </Vue>
    );
  }

  // Téléphone (§6.9) : la planche sur le folio, puis l'échelle sur le champ, puis le texte.
  return (
    <Vue partition="parti">
      <article className={styles.tel} aria-labelledby={titreId}>
        <Feuillet as="div">{tete}</Feuillet>
        <div className={styles.champTel}>{echelle}</div>
        <Feuillet as="div">{folio}</Feuillet>
        <aside className={styles.champTel} aria-label={t('v3.registres.planche.colonne')}>
          {cavaliers}
          {lieux}
        </aside>
      </article>
    </Vue>
  );
}

function NomPlanche({ dragon }: { dragon: Dragon }) {
  const title = useTitle();
  const shown = title(dragonName(dragon));
  return (
    <span className={styles.pagerNom} lang={shown.isHv ? VALYRIAN_TAG : undefined}>
      {shown.primary}
    </span>
  );
}

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { getDragon, getExtraTextualNote, getLookNote } from '@/core/content/dragons';
import { getPlace } from '@/core/content/places';
import type { Localized } from '@/core/content/types';
import { getBattle } from '@/core/content/wars';
import { formatYear, Gloss, useLang, useT, useTx, useTxTypo } from '@/core/i18n';
import { ReliabilityGlyph } from '@/shared/marks/Marks';

import { Carte } from '../components/Carte';
import { Introuvable } from '../components/Introuvable';
import { NomEntite } from '../components/NomEntite';
import { Ombre } from '../components/Ombre';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Prose } from '../components/Prose';
import { SourcesPied } from '../components/SourcesPied';
import { Vide } from '../components/Vide';
import { useFasce } from '../state/fasce';

import { dragonInBattle, dragonPlaces, dragonYears } from './registres/appearances';
import { Colonne } from './registres/Colonne';
import { lifeOf } from './registres/dragonLife';
import { PlancheDragon } from './registres/PlancheDragon';
import { VieCavaliers } from './registres/VieCavaliers';
import styles from './DragonPage.module.css';

const PARTS = ['body', 'wing', 'crest', 'flame'] as const;

/**
 * Planche `/dragons/:dragonId` (champ plein, spec §5.10). Premier écran : le dragon à
 * l'échelle commune de toutes les planches, le fantôme du précédent, la réserve du nom.
 * Dessous, en parti : le sort en chapeau, la robe, l'origine, les batailles et le sort du
 * dragon dans chacune, l'adaptation à part, les lieux où il paraît, les sources ; à droite,
 * collants, les cavaliers sur la vie agrandie, la carte numérotée des lieux et le profil.
 */
export default function DragonPage() {
  const { dragonId = '' } = useParams();
  const dragon = getDragon(dragonId);
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  const { reading } = useLang();
  const life = dragon ? lifeOf(dragon.id) : undefined;
  useFasce({ span: life ? [life.from, life.to] : null });

  const places = useMemo(() => (dragon ? dragonPlaces(dragon) : []), [dragon]);
  const years = useMemo(() => (dragon ? dragonYears(dragon) : []), [dragon]);
  const marks = useMemo(() => new Map(places.map((place) => [place.placeId, String(place.order)])), [places]);

  if (!dragon) return <Introuvable />;

  const look = dragon.look.attested;
  const described = PARTS.filter((part) => look[part]).map((part) => t(`page.dragon.part.${part}`).toLowerCase());
  const bare = PARTS.filter((part) => !look[part]).map((part) => t(`page.dragon.part.${part}`).toLowerCase());
  const lookNote = getLookNote(dragon.id);
  const extra = getExtraTextualNote(dragon.id);
  const fought = dragon.battleIds.flatMap((id) => {
    const battle = getBattle(id);
    return battle ? [battle] : [];
  });
  const name = tx(dragon.name);

  const entete = (
    <div className={styles.entete}>
      <h2 className={styles.surtitre}>
        <Gloss k="page.dragon.fate.heading" />
      </h2>
      <Prose text={dragon.fate} variant="chapeau" />
    </div>
  );

  const recit = (
    <div className={styles.recit}>
      <section className={styles.section} aria-labelledby="robe">
        <h2 id="robe" className={styles.titre}>
          <Gloss k="page.dragon.appearance.heading" />
        </h2>
        {dragon.appearance ? <Prose text={dragon.appearance} /> : <p className={styles.cendre}>{t('page.dragon.appearance.none')}</p>}
        <p className={styles.appareil}>
          {described.length > 0 ? <span>{t('v2.dragon.colours_described', { parts: described.join(', ') })}</span> : null}
          {bare.length > 0 ? <span>{t('v2.dragon.colours_not_described', { parts: bare.join(', ') })}</span> : null}
        </p>
        {lookNote?.size || lookNote?.color ? (
          <div className={styles.appareil}>
            {lookNote.size ? <p>{typo(lookNote.size)}</p> : null}
            {lookNote.color ? <p>{typo(lookNote.color)}</p> : null}
          </div>
        ) : null}
        {extra ? (
          <div className={styles.horsLivres}>
            <p className={styles.appareil}>{t('page.dragon.extra')}</p>
            <Prose text={extra} />
          </div>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="origine">
        <h2 id="origine" className={styles.titre}>
          <Gloss k="page.dragon.origin.heading" />
        </h2>
        <Prose text={dragon.origin} />
      </section>

      <section className={styles.section} aria-labelledby="batailles">
        <h2 id="batailles" className={styles.titre}>
          <Gloss k="page.dragon.battles.heading" />
        </h2>
        {fought.length === 0 ? (
          <p className={styles.cendre}>{t('v2.dragon.no_battles')}</p>
        ) : (
          <ol className={styles.batailles} role="list">
            {fought.map((battle) => {
              const engaged = dragonInBattle(battle, dragon.id);
              return (
                <li key={battle.id} className={styles.bataille}>
                  <span className={styles.annee}>{formatYear(battle.year, reading)}</span>
                  <div className={styles.batailleCorps}>
                    <p className={styles.batailleNom}>
                      <NomEntite kind="battle" id={battle.id} name={battle.name} />
                    </p>
                    {engaged ? <p className={styles.sort}>{typo(engaged.fate)}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {dragon.adaptationNote ? (
        <section className={styles.adaptation} aria-labelledby="adaptation">
          <h2 id="adaptation" className={styles.titreAdaptation}>
            <ReliabilityGlyph level="adaptation" className={styles.marque} title={t('label.continuity.show')} />
            <Gloss k="page.dragon.adaptation.heading" />
          </h2>
          <Prose text={dragon.adaptationNote} />
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="lieux">
        <h2 id="lieux" className={styles.titre}>
          {t('v2.dragon.places_heading')}
        </h2>
        {places.length === 0 ? (
          <Vide>{t('v2.dragon.places_none')}</Vide>
        ) : (
          <>
            <p className={styles.appareil}>{t('v2.dragon.places')}</p>
            <ol className={styles.lieux} role="list">
              {places.map((place) => (
                <li key={place.placeId} className={styles.lieu}>
                  <span className={styles.numero} aria-hidden="true">
                    {place.order}
                  </span>
                  <div>
                    <p className={styles.lieuNom}>
                      <NomEntite kind="place" id={place.placeId} name={placeName(place.placeId)} />
                    </p>
                    <ul className={styles.faits} role="list">
                      {place.items.map((item) => (
                        <li key={`${item.kind}:${item.id}`}>
                          <span className={styles.annee}>{formatYear(item.year, reading)}</span>{' '}
                          <NomEntite kind={item.kind} id={item.id} name={item.name} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <SourcesPied sources={dragon.sources} />
    </div>
  );

  const temps = (
    <Colonne
      span={life ? [life.from, life.to] : null}
      part={0.3}
      haut={
        <div className={styles.vie}>
          <h2 className={styles.titreColonne}>
            <Gloss k="page.dragon.riders.heading" />
          </h2>
          {life ? <VieCavaliers dragon={dragon} life={life} years={years} /> : <p className={styles.cendre}>{t('v2.dragon.life_unknown')}</p>}
        </div>
      }
      carte={
        places.length > 0 ? (
          <Carte title={t('v2.dragon.places_map', { name })} placeIds={places.map((place) => place.placeId)} marks={marks} />
        ) : (
          <Vide>{t('v2.dragon.places_none')}</Vide>
        )
      }
    />
  );

  return (
    <Page partition="champ">
      <PlancheDragon key={dragon.id} dragon={dragon} />
      <div className={styles.dessous}>
        <Parti entete={entete} recit={recit} temps={temps} />
      </div>
      <Ombre once={`ombre:dragon:${dragon.id}`} look={dragon.look} />
    </Page>
  );
}

function placeName(id: string): Localized {
  return getPlace(id)?.name ?? { fr: id, en: id };
}

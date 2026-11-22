import { useMemo } from 'react';

import type { Localized, Reliability } from '@/core/content/types';
import { formatSpan, formatYear, Gloss, useLang, useT, useTitle, useTx, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { DragonFigure } from '@/shared/dragon';
import { CrownGlyph } from '@/shared/marks/Marks';

import { ageAt, placeYears, relationsOf } from '../../model/relations';
import type { RelatedEntity } from '../../model/relations';
import { entityPath } from '../../state/entities';
import { useFasce } from '../../state/fasce';
import { registry } from '../../state/registry';
import { presence, sovereigns } from '../../state/scene';
import type { EntityKind } from '../../state/useVoir';
import { useYear } from '../../state/year';
import { Fiabilite } from '../Fiabilite';
import { Lien } from '../Lien';
import { NomEntite } from '../NomEntite';

import styles from './Apercu.module.css';

interface Head {
  name: Localized;
  sub?: Localized;
  span: readonly [number, number] | null;
  spanText: string;
  approx: boolean;
  reliability?: Reliability;
  reign?: readonly [number, number];
  marks?: number[];
}

function dragonSpan(id: string): readonly [number, number] | null {
  let from: number | null = null;
  let to: number | null = null;
  for (const entry of presence.years) {
    if (!entry.attested.includes(id) && !entry.doubtful.includes(id)) continue;
    from ??= entry.year;
    to = entry.year;
  }
  return from === null || to === null ? null : [from, to];
}

function headOf(kind: EntityKind, id: string, lang: 'fr' | 'en'): Head | null {
  switch (kind) {
    case 'person': {
      const person = registry.persons.get(id);
      if (!person) return null;
      const born = person.born ?? person.bornRange?.[0] ?? null;
      const died = person.died ?? person.diedRange?.[1] ?? (person.alive ? 300 : null);
      const sovereign = sovereigns.find((candidate) => candidate.id === id);
      return {
        name: person.name,
        sub: person.epithet,
        span: born !== null && died !== null ? [born, died] : null,
        spanText: formatSpan(person.born ?? person.bornRange?.[0], person.died ?? person.diedRange?.[1], lang),
        approx: person.dateCertainty !== 'exacte',
        reign: sovereign ? [sovereign.reignFrom, sovereign.reignTo] : undefined,
      };
    }
    case 'dragon': {
      const dragon = registry.dragons.get(id);
      if (!dragon) return null;
      const span = dragonSpan(id);
      return {
        name: dragon.name,
        sub: dragon.alias,
        span,
        spanText: formatSpan(dragon.hatched, dragon.died, lang),
        approx: dragon.hatched === null,
        reliability: dragon.reliability,
      };
    }
    case 'place': {
      const place = registry.places.get(id);
      if (!place) return null;
      return { name: place.name, sub: place.region, span: null, spanText: '', approx: false, marks: placeYears(registry, id) };
    }
    case 'war': {
      const war = registry.wars.get(id);
      if (!war) return null;
      return { name: war.title, span: [war.from, war.to], spanText: formatSpan(war.from, war.to, lang), approx: false, reliability: war.reliability };
    }
    case 'battle': {
      const battle = registry.battles.get(id);
      if (!battle) return null;
      return {
        name: battle.name,
        sub: battle.placeName,
        span: battle.year === null ? null : [battle.year, battle.year],
        spanText: formatYear(battle.year, lang),
        approx: battle.dateCertainty !== 'exacte',
        reliability: battle.reliability,
      };
    }
    case 'event': {
      const event = registry.events.get(id);
      if (!event) return null;
      return {
        name: event.title,
        span: event.year === null ? null : [event.year, event.yearEnd ?? event.year],
        spanText: formatSpan(event.year, event.yearEnd ?? event.year, lang),
        approx: event.dateCertainty !== 'exacte',
        reliability: event.reliability,
      };
    }
  }
}

const ROWS = [
  { key: 'blood', label: 'label.blood' },
  { key: 'dragon', label: 'label.dragon' },
  { key: 'war', label: 'label.war' },
  { key: 'place', label: 'label.place' },
] as const;

const SHOWN = 3;

function Row({ label, items }: { label: string; items: readonly RelatedEntity[] }) {
  const t = useT();
  return (
    <div className={styles.rangee}>
      <dt className={styles.etiquette}>
        <Gloss k={label} />
      </dt>
      <dd className={styles.noms}>
        {items.length === 0 ? (
          <span className={styles.aucun}>{t('v2.cartel.none')}</span>
        ) : (
          items.slice(0, SHOWN).map((item, index) => (
            <span key={`${item.kind}:${item.id}`}>
              {index > 0 ? ', ' : null}
              <NomEntite kind={item.kind} id={item.id} name={item.name} />
            </span>
          ))
        )}
      </dd>
      <dd className={styles.compte}>{items.length > 0 ? items.length : null}</dd>
    </div>
  );
}

/**
 * L'aperçu d'une entité dans le cartel (spec §5.2) : nom et glose, épithète, années, marque
 * de fiabilité, règne, âge à l'année réglée ; les quatre rangées sang, dragon, guerre, lieu,
 * toujours dans cet ordre ; « ouvrir la fiche ». Tant qu'il est ouvert, la vie de l'entité
 * est tenue sur la fasce.
 */
export function Apercu({ kind, id }: { kind: EntityKind; id: string }) {
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const year = useYear();
  const head = useMemo(() => headOf(kind, id, reading), [kind, id, reading]);
  const rows = useMemo(() => relationsOf(registry, kind, id), [kind, id]);

  useFasce(
    {
      span: head?.span ?? null,
      reign: head?.reign ?? null,
      marks: head?.marks?.map((mark) => ({ year: mark })),
    },
    'cartel',
  );

  if (!head) return <p className={styles.aucun}>{t('v2.cartel.unknown')}</p>;

  const name = title(head.name);
  const page = entityPath(kind, id);
  const person = kind === 'person' ? registry.persons.get(id) : undefined;
  const age = person && year !== null ? ageAt(person, year) : null;
  const dragon = kind === 'dragon' ? registry.dragons.get(id) : undefined;

  let ageText: string | null = null;
  if (age && year !== null) {
    const when = formatYear(year, reading);
    if (age.state === 'alive') {
      if (age.approx && age.age > 1) ageText = t('v2.year.age_approx', { year: when, n: age.age });
      else if (age.age === 0) ageText = t('v2.year.age.zero', { year: when });
      else ageText = t(age.age === 1 ? 'v2.year.age.one' : 'v2.year.age.many', { year: when, n: age.age });
    } else if (age.state === 'dead') {
      ageText = t(age.since === 1 ? 'v2.year.dead_since.one' : 'v2.year.dead_since.many', { year: when, n: age.since });
    }
    else ageText = t('v2.year.unborn', { year: when });
  }

  return (
    <article className={styles.root}>
      <header className={styles.tete}>
        {dragon ? (
          <div className={styles.figure}>
            <DragonFigure look={dragon.look} title={tx(dragon.name)} tone="specimen" ground="dark" detail="plain" unattested="bare" />
          </div>
        ) : null}
        <h2 className={styles.nom}>
          <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
          {name.gloss ? <span className={styles.glose}>{name.gloss}</span> : null}
        </h2>
        {head.sub ? <p className={styles.sous}>{typo(head.sub)}</p> : null}
        <p className={styles.dates}>
          {head.spanText ? <span>{head.approx && head.span ? t('v2.cartel.circa', { span: head.spanText }) : head.spanText}</span> : null}
          {head.reliability ? <Fiabilite level={head.reliability} /> : null}
        </p>
        {head.reign ? (
          <p className={styles.regne}>
            <CrownGlyph variant="legible" size="1em" className={styles.couronne} />
            {t('v2.cartel.reign', { span: formatSpan(head.reign[0], head.reign[1], reading) })}
          </p>
        ) : null}
        {ageText ? <p className={styles.age}>{ageText}</p> : null}
      </header>

      <dl className={styles.rangees}>
        {ROWS.map((row) => (
          <Row key={row.key} label={row.label} items={rows[row.key]} />
        ))}
      </dl>

      <Lien to={page.to} year={page.year} className={styles.fiche}>
        {t('v2.cartel.open_page')}
      </Lien>
    </article>
  );
}

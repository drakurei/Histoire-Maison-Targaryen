/*
 * Petites pièces des vues du savoir (groupe D), posables sur les deux surfaces : elles ne
 * lisent que les encres --v3-* (commun.module.css). `Refs` de la V2 écrit l'ivoire en dur et
 * ne vit que sur le champ ; celles-ci vont aussi sur le vélin.
 */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Gloss, useT } from '@/core/i18n';
import { refLabel } from '@/versions/v2/pages/savoirs/glose';

import commun from './commun.module.css';

/** Les références d'une forme, d'une formule, d'une leçon : titre lisible, puis le site. */
export function Refs3({ refs, k = 'page.lexicon.entry.refs', className }: { refs: readonly string[]; k?: string; className?: string }) {
  if (refs.length === 0) return null;
  return (
    <div className={`${commun.refs} ${className ?? ''}`}>
      <span className={commun.refsTitre}>
        <Gloss k={k} />
      </span>
      <ul role="list" className={commun.refsListe}>
        {refs.map((ref) => {
          const { titre, site } = refLabel(ref);
          return (
            <li key={ref}>
              {site ? (
                <a href={ref} rel="noreferrer noopener" target="_blank">
                  <cite>{titre}</cite>
                  {site !== titre && !titre.startsWith(site) ? <span>&nbsp;({site})</span> : null}
                </a>
              ) : (
                <cite>{titre}</cite>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export interface EntreeSommaire {
  id: string;
  label: string;
  /** Rang écrit en Grenze (une vraie suite). */
  rang?: string;
  lang?: string;
}

/** Un sommaire d'ancres ; l'entrée en cours de lecture porte `aria-current`. */
export function Sommaire3({ label, entries, active, className }: { label: string; entries: readonly EntreeSommaire[]; active?: string | null; className?: string }) {
  return (
    <nav className={`${commun.sommaire} ${className ?? ''}`} aria-label={label}>
      <ol role="list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a href={`#${entry.id}`} aria-current={active === entry.id ? 'location' : undefined}>
              <span className={commun.sommaireRang} aria-hidden="true">
                {entry.rang ?? ''}
              </span>
              <span className={commun.sommaireNom} lang={entry.lang}>
                {entry.label}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Écrit des paramètres de l'adresse sans entrée d'historique ni saut de défilement. */
export function useAdresse(): [URLSearchParams, (changes: Record<string, string | null>) => void] {
  const [params, setParams] = useSearchParams();
  const patch = useCallback(
    (changes: Record<string, string | null>) => {
      const copy = new URLSearchParams(params);
      for (const [name, value] of Object.entries(changes)) {
        if (value) copy.set(name, value);
        else copy.delete(name);
      }
      setParams(copy, { replace: true, preventScrollReset: true });
    },
    [params, setParams],
  );
  return [params, patch];
}

/** Le décompte « n sur total » des filtres, dit poliment au lecteur d'écran. */
export function Compte({ n, total }: { n: number; total: number }) {
  const t = useT();
  return (
    <p className={commun.meta} aria-live="polite">
      {t('page.bati.filter.count', { n, total })}
    </p>
  );
}

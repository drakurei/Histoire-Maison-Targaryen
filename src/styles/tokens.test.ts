import { describe, expect, it } from 'vitest';

import { CSS_EASE, DURATION } from '@/core/motion/tokens';

import tokensCss from './tokens.css?raw';

/** Valeur déclarée pour un jeton, telle qu'écrite dans tokens.css (commentaire de fin de ligne exclu). */
function token(name: string): string | undefined {
  const match = new RegExp(`^\\s*--${name}:\\s*([^;]+);`, 'm').exec(tokensCss);
  return match?.[1]?.trim();
}

describe('tokens.css : couleurs de DESIGN.md §2', () => {
  const palette: Record<string, string> = {
    obsidienne: 'oklch(0.14 0.012 25)',
    suie: 'oklch(0.19 0.014 28)',
    basalte: 'oklch(0.27 0.012 35)',
    cendre: 'oklch(0.62 0.012 55)',
    ivoire: 'oklch(0.93 0.025 85)',
    velin: 'oklch(0.90 0.035 84)',
    'velin-ombre': 'oklch(0.84 0.045 80)',
    encre: 'oklch(0.24 0.02 40)',
    'encre-pale': 'oklch(0.42 0.025 45)',
    sang: 'oklch(0.50 0.19 25)',
    cramoisi: 'oklch(0.36 0.14 22)',
    braise: 'oklch(0.68 0.20 40)',
    rubrique: 'oklch(0.44 0.17 25)',
    or: 'oklch(0.76 0.11 84)',
    bronze: 'oklch(0.56 0.08 68)',
  };

  it.each(Object.entries(palette))('--%s vaut %s', (name, value) => {
    expect(token(name)).toBe(value);
  });

  it('ne contient ni noir pur ni blanc pur', () => {
    expect(tokensCss).not.toMatch(/#(?:000|fff)(?:000|fff)?\b/i);
    expect(tokensCss).not.toMatch(/oklch\(\s*[01](?:\.0+)?\s+0(?:\.0+)?\s/);
  });
});

describe('tokens.css : typographie et composition de DESIGN.md §3 et §6', () => {
  it('déclare les quatre voix', () => {
    expect(token('f-chronique')).toContain('Texturina Variable');
    expect(token('f-lettrine')).toContain('Grenze Gotisch Variable');
    expect(token('f-recit')).toContain('Alegreya Variable');
    expect(token('f-musee')).toContain('Alegreya Sans');
  });

  it('déclare toute l’échelle typographique', () => {
    for (const step of ['t-1', 't0', 't1', 't2', 't3', 't4', 't5', 't6']) {
      expect(token(step), `--${step}`).toBeDefined();
    }
    expect(token('t-1')).toBe('0.8rem');
    expect(token('t0')).toBe('clamp(1.06rem, 0.98rem + 0.3vw, 1.2rem)');
    expect(token('t5')).toBe('clamp(3.2rem, 2rem + 6vw, 7.5rem)');
    expect(token('t6')).toBe('clamp(4rem, 1rem + 13vw, 15rem)');
  });

  it('déclare le rythme d’espacement', () => {
    const rhythm = ['0.25rem', '0.5rem', '0.75rem', '1rem', '1.5rem', '2.5rem', '4rem', '6.5rem', '10.5rem'];
    rhythm.forEach((value, index) => {
      expect(token(`e${index + 1}`)).toBe(value);
    });
  });

  it('déclare la grille et le focus', () => {
    expect(token('gouttiere')).toBe('clamp(1rem, 2vw, 2rem)');
    expect(token('marge-page')).toBe('clamp(1.25rem, 5vw, 6rem)');
    expect(token('focus-epaisseur')).toBe('2px');
    expect(token('focus-decalage')).toBe('3px');
    expect(token('focus-couleur')).toBe('var(--braise)');
  });
});

describe('tokens.css et src/core/motion/tokens.ts disent la même chose', () => {
  const kebab = (name: string): string => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

  it.each(Object.entries(DURATION))('durée %s', (name, seconds) => {
    expect(token(`d-${kebab(name)}`)).toBe(`${Math.round(seconds * 1000)}ms`);
  });

  it.each(Object.entries(CSS_EASE))('courbe %s', (name, curve) => {
    expect(token(`c-${name}`)).toBe(curve);
  });
});

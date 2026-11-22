import { describe, expect, it } from 'vitest';

import { uiByKey } from '@/core/content/ui';

import { UI } from './uiKeys';

/** Toutes les clés de `UI`, y compris celles rangées par version. */
function allKeys(): string[] {
  return Object.values(UI).flatMap((entry) => (typeof entry === 'string' ? [entry] : Object.values(entry)));
}

describe('clés d’interface de l’enveloppe', () => {
  it.each(allKeys())('« %s » existe dans les chaînes d’interface', (key) => {
    expect(uiByKey.has(key)).toBe(true);
  });

  it.each(allKeys())('« %s » est traduite en français et en anglais', (key) => {
    const entry = uiByKey.get(key);
    expect(entry?.fr.trim()).toBeTruthy();
    expect(entry?.en.trim()).toBeTruthy();
  });
});

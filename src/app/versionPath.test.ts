import { describe, expect, it } from 'vitest';

import { isVersionId, splitVersionPath, versionNumber, versionPath } from './versionPath';

describe('versionPath', () => {
  it('préfixe un chemin interne', () => {
    expect(versionPath('version-1', '/dragons/balerion')).toBe('/version-1/dragons/balerion');
    expect(versionPath('version-3', '/chroniques/p5')).toBe('/version-3/chroniques/p5');
  });

  it('mène au portail de la version', () => {
    expect(versionPath('version-1', '/')).toBe('/version-1');
    expect(versionPath('version-2', '')).toBe('/version-2');
  });

  it('garde la requête et l’ancre', () => {
    expect(versionPath('version-2', '/lignee?p=aegon-i')).toBe('/version-2/lignee?p=aegon-i');
    expect(versionPath('version-1', '/guerres/danse#herbe-rouge')).toBe('/version-1/guerres/danse#herbe-rouge');
    expect(versionPath('version-1', '/?lang=fr')).toBe('/version-1?lang=fr');
  });

  it('laisse intacts les liens de la même page', () => {
    expect(versionPath('version-1', '#herbe-rouge')).toBe('#herbe-rouge');
    expect(versionPath('version-1', '?p=aegon-i')).toBe('?p=aegon-i');
  });

  it('tolère un chemin sans barre initiale ou avec une barre finale', () => {
    expect(versionPath('version-1', 'dragons')).toBe('/version-1/dragons');
    expect(versionPath('version-1', '/dragons/')).toBe('/version-1/dragons');
  });

  it('ne préfixe jamais deux fois', () => {
    expect(versionPath('version-1', '/version-1/dragons')).toBe('/version-1/dragons');
    expect(versionPath('version-1', '/version-2')).toBe('/version-2');
  });

  it('ne prend pas pour un préfixe un chemin qui lui ressemble', () => {
    expect(versionPath('version-1', '/version-12')).toBe('/version-1/version-12');
    expect(versionPath('version-1', '/versions')).toBe('/version-1/versions');
  });
});

describe('splitVersionPath', () => {
  it('sépare la version du chemin interne', () => {
    expect(splitVersionPath('/version-1/dragons/balerion')).toEqual({ version: 'version-1', path: '/dragons/balerion' });
  });

  it('rend le portail pour la racine d’une version', () => {
    expect(splitVersionPath('/version-3')).toEqual({ version: 'version-3', path: '/' });
    expect(splitVersionPath('/version-3/')).toEqual({ version: 'version-3', path: '/' });
  });

  it('signale une adresse hors version', () => {
    expect(splitVersionPath('/comparer')).toEqual({ version: null, path: '/comparer' });
    expect(splitVersionPath('/version-4/dragons')).toEqual({ version: null, path: '/version-4/dragons' });
  });

  it('est l’inverse de versionPath', () => {
    const { version, path } = splitVersionPath(versionPath('version-2', '/lieux/peyredragon'));
    expect(version).toBe('version-2');
    expect(path).toBe('/lieux/peyredragon');
  });
});

describe('isVersionId, versionNumber', () => {
  it('reconnaît les trois versions et elles seules', () => {
    expect(isVersionId('version-1')).toBe(true);
    expect(isVersionId('version-4')).toBe(false);
    expect(isVersionId(undefined)).toBe(false);
  });

  it('donne le numéro d’une version', () => {
    expect(versionNumber('version-1')).toBe(1);
    expect(versionNumber('version-3')).toBe(3);
  });
});

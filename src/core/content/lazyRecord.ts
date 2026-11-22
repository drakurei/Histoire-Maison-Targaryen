/**
 * Jeu de contenu découpé en un fichier par fiche, chargé à la demande.
 *
 * `import.meta.glob` donne un bloc par fichier : une page ne télécharge que la fiche qu'elle
 * affiche. Les modules qui s'en servent lisent la fiche avec `use(record.load(id))` : le
 * composant attend dans le <Suspense> de la version la première fois, puis lit la fiche sans attente (la promesse est gardée et
 * marquée résolue, ce que `use()` reconnaît).
 */
type Tracked<T> = Promise<T> & { status?: 'pending' | 'fulfilled' | 'rejected'; value?: T; reason?: unknown };

function settled<T>(value: T): Tracked<T> {
  const promise: Tracked<T> = Promise.resolve(value);
  promise.status = 'fulfilled';
  promise.value = value;
  return promise;
}

function track<T>(promise: Promise<T>): Tracked<T> {
  const tracked: Tracked<T> = promise;
  tracked.status = 'pending';
  promise.then(
    (value) => {
      tracked.status = 'fulfilled';
      tracked.value = value;
    },
    (reason: unknown) => {
      tracked.status = 'rejected';
      tracked.reason = reason;
    },
  );
  return tracked;
}

export interface LazyRecord<T> {
  /** Ids disponibles, sans rien charger. */
  has(id: string): boolean;
  /** Charge la fiche (ou `undefined` si l'id n'a pas de fichier). Promesse gardée par id. */
  load(id: string): Promise<T | undefined>;
}

/** `loaders` : sortie de `import.meta.glob(..., { import: 'default' })`, clé = chemin du fichier. */
export function lazyRecord<T>(loaders: Record<string, () => Promise<unknown>>): LazyRecord<T> {
  const byId = new Map<string, () => Promise<unknown>>();
  for (const [file, loader] of Object.entries(loaders)) {
    const id = file.slice(file.lastIndexOf('/') + 1).replace(/\.json$/, '');
    byId.set(id, loader);
  }
  const cache = new Map<string, Tracked<T | undefined>>();

  function load(id: string): Tracked<T | undefined> {
    const known = cache.get(id);
    if (known) return known;
    const loader = byId.get(id);
    // Seul transtypage : la forme du fichier est garantie par scripts/build-content.mjs.
    const promise = loader ? track(loader().then((data) => data as T)) : settled<T | undefined>(undefined);
    cache.set(id, promise);
    return promise;
  }

  return {
    has: (id) => byId.has(id),
    load,
  };
}

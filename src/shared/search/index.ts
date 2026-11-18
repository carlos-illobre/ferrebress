// El índice para buscar productos (07 · R3; ADR-022), en memoria y sin nada del servidor: en 15b sirve
// también en el celular sin conexión. Tiene dos partes: uno armado, grande, que no cambia (built.ts), y
// otro chico con lo que cambió después; buscar junta lo de los dos, en orden. Cuando lo cambiado crece,
// el grande se vuelve a armar de a pedazos, sin frenar a quien busca; mientras tanto, con muchos
// cambios juntos (una lista grande), se busca en el de antes hasta que esté.
import { searchKey } from '../text/search-key.ts';
import {
  type Built,
  build,
  buildInSteps,
  type Hit,
  type Partial,
  type Query,
  type SearchDoc,
  searchBuilt,
} from './built.ts';

export type { Query, SearchDoc } from './built.ts';

// Los encontrados en orden; los números, de todo el catálogo o de la marca elegida (07 · E16).
export type Found = { ids: string[]; total: number; noPrice: number };

export type IndexOptions = {
  // Desde cuántos cambiados se vuelve a armar el grande.
  changedMax?: number;
  // Cómo se cede el turno entre pedazos al armarlo.
  pause?: () => Promise<void>;
};

const collator = new Intl.Collator('es', { sensitivity: 'base' });
const empty = build([]);

// Junta dos listas en orden por su clave.
function merged(a: Hit[], b: Hit[]): Hit[] {
  if (b.length === 0) return a;
  const out: Hit[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    const takeA = j >= b.length || (i < a.length && (a[i] as Hit).key < (b[j] as Hit).key);
    out.push((takeA ? a[i++] : b[j++]) as Hit);
  }
  return out;
}

const together = (main: Partial, changed: Partial): Found => ({
  ids: main.groups.flatMap((group, i) =>
    merged(group, changed.groups[i] as Hit[]).map((h) => h.id),
  ),
  total: main.total + changed.total,
  noPrice: main.noPrice + changed.noPrice,
});

// Las marcas, una vez cada una, en orden alfabético.
function brandsOf(docs: Iterable<SearchDoc>): string[] {
  const names = new Map<string, string>();
  for (const doc of docs)
    if (doc.brand !== null && !names.has(searchKey(doc.brand)))
      names.set(searchKey(doc.brand), doc.brand);
  return [...names.values()].sort(collator.compare);
}

// El grande, el chico con lo cambiado y cómo se vuelve a armar el grande.
function createParts(docs: Map<string, SearchDoc>, changedMax: number, pause: () => Promise<void>) {
  let main: Built = build([...docs.values()]);
  // Lo cambiado desde que se armó el grande (`null`, ya no está), y lo cambiado desde que se empezó a
  // armar el siguiente.
  let changed = new Map<string, SearchDoc | null>();
  let sinceRebuild: Map<string, SearchDoc | null> | undefined;
  let small: Built = empty;
  let skip: Uint8Array | undefined;
  let rebuilding: Promise<void> = Promise.resolve();

  // El chico y qué productos del grande ya no valen, con lo cambiado.
  const refreshSmall = () => {
    small = build([...changed.values()].filter((doc) => doc !== null));
    skip = new Uint8Array(main.ids.length);
    for (const id of changed.keys()) {
      const ord = main.ordOf.get(id);
      if (ord !== undefined) skip[ord] = 1;
    }
  };
  const fresh = () => changed.size <= changedMax;
  // Mientras lo cambiado mientras se armaba siga siendo mucho, se vuelve a armar.
  const rebuild = async () => {
    do {
      sinceRebuild = new Map();
      // Lo de quien lo pidió termina primero.
      await pause();
      main = await buildInSteps([...docs.values()], pause);
      changed = sinceRebuild;
      sinceRebuild = undefined;
    } while (!fresh());
    refreshSmall();
  };
  return {
    search: (query: Query): Found =>
      fresh()
        ? together(searchBuilt(main, query, skip), searchBuilt(small, query))
        : together(searchBuilt(main, query), searchBuilt(empty, query)),
    note(id: string, doc: SearchDoc | null) {
      changed.set(id, doc);
      sinceRebuild?.set(id, doc);
    },
    // Después de anotar: el chico de nuevo o, con muchos cambios, el grande de a pedazos.
    noted() {
      if (fresh()) refreshSmall();
      else if (!sinceRebuild) rebuilding = rebuild();
    },
    settled: (): Promise<void> => rebuilding,
  };
}

export function createSearchIndex(initial: readonly SearchDoc[] = [], options: IndexOptions = {}) {
  const { changedMax = 2000, pause = () => new Promise<void>((done) => setTimeout(done, 0)) } =
    options;
  const docs = new Map(initial.map((doc) => [doc.id, doc]));
  const parts = createParts(docs, changedMax, pause);
  let brands: string[] | undefined;
  return {
    search: parts.search,
    brands: (): string[] => {
      brands ??= brandsOf(docs.values());
      return brands;
    },
    size: (): number => docs.size,
    // Productos nuevos o cambiados, y los que ya no están (dados de baja).
    replace(updated: readonly SearchDoc[], gone: readonly string[]): void {
      for (const id of gone) {
        docs.delete(id);
        parts.note(id, null);
      }
      for (const doc of updated) {
        docs.set(doc.id, doc);
        parts.note(doc.id, doc);
      }
      brands = undefined;
      parts.noted();
    },
    // Espera que termine de armarse el grande, si se está armando.
    settled: (): Promise<void> => parts.settled(),
  };
}

export type SearchIndex = ReturnType<typeof createSearchIndex>;

// Poner al día el índice de búsqueda con lo que confirmó una transacción (diseño de 07, § 5): con lo
// que dice la base de esos productos; si eso falla, el índice entero de nuevo.
import type { SearchDoc, SearchIndex } from '@ferrebress/shared/search/index';

type Read = {
  docsOf: (ids: readonly string[]) => Promise<{ changed: SearchDoc[]; gone: string[] }>;
  docs: () => Promise<SearchDoc[]>;
};

export const refresher =
  (index: Pick<SearchIndex, 'replace'>, read: () => Read) =>
  async (ids: string[]): Promise<void> => {
    try {
      const { changed, gone } = await read().docsOf(ids);
      index.replace(changed, gone);
    } catch (error) {
      console.error(error);
      index.replace(await read().docs(), []);
    }
  };

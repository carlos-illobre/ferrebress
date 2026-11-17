// El modelo del panel de las listas que se suben (08 · pantalla 2; ADR-019): lo que se dice de cada
// una, los proveedores para elegir de quién es y lo que se puede hacer. Lo escrito para buscar un
// proveedor o dar de alta uno nuevo es de quien lo escribe.
import type { ListScope } from '@ferrebress/shared/contracts/price-lists';
import { useState } from 'preact/hooks';
import { useStore } from '../../../platform/store.ts';
import { plain } from '../../../platform/text.ts';
import { openReview } from '../pages.ts';
import { cancel, choose, close, confirm, readAnyway, scopeOf, supplierOf } from './actions.ts';
import { linesOf } from './rules.ts';
import { knownSuppliers, uploads } from './store.ts';

// Cuántos proveedores se ofrecen a la vez al elegir.
const shownSuppliers = 8;

export function useUploads() {
  const all = useStore(uploads);
  const suppliers = useStore(knownSuppliers);
  const [searches, setSearches] = useState<Record<string, string>>({}); // local: lo que busca
  const [names, setNames] = useState<Record<string, string>>({}); // local: el nombre nuevo
  return {
    uploads: all.map((upload) => linesOf(upload, suppliers)),
    searchOf: (key: string) => searches[key] ?? '',
    search: (key: string, text: string) => setSearches({ ...searches, [key]: text }),
    // Los proveedores que coinciden con lo buscado, sin acentos ni mayúsculas, en orden alfabético.
    optionsOf: (key: string) => {
      const wanted = plain((searches[key] ?? '').trim());
      return suppliers
        .filter((row) => plain(row.name).includes(wanted))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        .slice(0, shownSuppliers)
        .map((row) => ({ id: row.id, name: row.name }));
    },
    newNameOf: (key: string) => names[key] ?? '',
    typeNewName: (key: string, name: string) => setNames({ ...names, [key]: name }),
    pick: (key: string, supplierId: string) => supplierOf(key, { supplierId }),
    createNew: (key: string) => supplierOf(key, { newSupplier: { name: names[key] ?? '' } }),
    ...{ cancel, close, confirm, readAnyway, change: choose },
    setScope: (key: string, scope: ListScope) => scopeOf(key, scope),
    review: (key: string) => {
      const listId = all.find((upload) => upload.key === key)?.listId as string;
      close(key);
      openReview(listId);
    },
  };
}

export type Uploads = ReturnType<typeof useUploads>;

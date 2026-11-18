// El modelo del panel de las listas que se suben (08 · pantalla 2; ADR-019): lo que se dice de cada
// una, los proveedores para elegir de quién es y lo que se puede hacer. Lo escrito para buscar un
// proveedor o dar de alta uno nuevo, con sus datos, es de quien lo escribe.
import type { ListScope, SupplierField } from '@ferrebress/shared/contracts/price-lists';
import { useState } from 'preact/hooks';
import { useStore } from '../../../platform/store.ts';
import { plain } from '../../../platform/text.ts';
import { openReview } from '../pages.ts';
import { cancel, choose, close, confirm, readAnyway, scopeOf, supplierOf } from './actions.ts';
import { type Draft, linesOf, newFieldsOf, newSupplierOf } from './rules.ts';
import { knownSuppliers, uploads } from './store.ts';
import { uploadsTexts as texts } from './texts.ts';

// Cuántos proveedores se ofrecen a la vez al elegir.
const shownSuppliers = 8;

export function useUploads() {
  const all = useStore(uploads);
  const suppliers = useStore(knownSuppliers);
  const [searches, setSearches] = useState<Record<string, string>>({}); // local: lo que busca
  // local: lo que se escribe del proveedor nuevo, y si se ven los demás datos
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [more, setMore] = useState<Record<string, boolean>>({}); // local: los demás datos abiertos
  const draftOf = (key: string): Draft => drafts[key] ?? {};
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
    // Proveedor nuevo (R2.2): el nombre y, si se quiere, los demás datos.
    newFieldsOf: (key: string) => newFieldsOf(draftOf(key), more[key] ?? false),
    typeNew: (key: string, field: SupplierField, value: string) =>
      setDrafts({ ...drafts, [key]: { ...draftOf(key), [field]: value } }),
    moreLabelOf: (key: string) => (more[key] ? texts.lessData : texts.moreData),
    toggleMore: (key: string) => setMore({ ...more, [key]: !more[key] }),
    pick: (key: string, supplierId: string) => supplierOf(key, { supplierId }),
    createNew: (key: string) => supplierOf(key, { newSupplier: newSupplierOf(draftOf(key)) }),
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

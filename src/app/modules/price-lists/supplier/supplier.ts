// El modelo de la pantalla de un proveedor (08 · pantalla 4, R2.3; ADR-019): sus datos (los ve
// cualquiera), y con «Ver costos», cómo cobra, sus listas y sus productos. Cambiar, dar de baja y
// reactivar, con «Administrar proveedores»; subir una lista suya, con «Cargar listas». La parte que se
// mira se espeja; sin conexión, lo último que se vio, en gris.

import { can } from '@ferrebress/shared/contracts/can';
import type { SupplierField, SupplierResponse } from '@ferrebress/shared/contracts/price-lists';
import { useRef, useState } from 'preact/hooks';
import { useLastSeen } from '../../../platform/last-seen.ts';
import { useMirroredQuery } from '../../../platform/mirror/query.ts';
import { useMirrored } from '../../../platform/mirror/use-mirrored.ts';
import { useScreen } from '../../../platform/screens.ts';
import { online as onlineStore } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { formatTime } from '../../../platform/time.ts';
import { person as me } from '../../sign-in/index.ts';
import { suppliersApi } from '../api.ts';
import { downloadList } from '../download.ts';
import { openReview, openSuppliers } from '../pages.ts';
import { supplierSchemas } from '../schemas.ts';
import { startUploads } from '../uploads/actions.ts';
import { useItems, useLists } from './browse.ts';
import { changeField, type FieldDeps } from './fields.ts';
import { fieldsOf, termsLines } from './rules.ts';
import { type Dropping, deactivate, reactivate, type StateDeps } from './state.ts';
import { useTerms } from './use-terms.ts';

export type Part = 'data' | 'terms' | 'lists' | 'items';
const allParts: readonly Part[] = ['data', 'terms', 'lists', 'items'];

function useAccess() {
  const person = useStore(me);
  const may = (id: Parameters<typeof can>[1]) => !!person && can(person, id);
  return {
    who: person as object,
    online: useStore(onlineStore),
    costs: may('price-lists.costs'),
    manage: may('price-lists.suppliers'),
    load: may('price-lists.load'),
  };
}

function useShown(id: string, who: object) {
  const query = useMirroredQuery('price-lists.supplier', () => suppliersApi.one(id), [id], {
    mode: 'refetch',
    schema: supplierSchemas.supplier,
  });
  const seen = useLastSeen<SupplierResponse>('supplier', who, query.data);
  const [part, setPart] = useMirrored<Part>(
    'price-lists.supplier.part',
    'data',
    supplierSchemas.part,
  );
  const supplier = query.data ?? (query.failed ? seen?.data : undefined);
  return { query, seen, part, setPart, supplier };
}

// Cambiar un dato, con lo que se dice de cada uno en su lugar.
function useFields(deps: Omit<FieldDeps, 'say'>) {
  const [said, setSaid] = useState<Partial<Record<SupplierField, string>>>({}); // local: por dato
  const say = (field: SupplierField, text: string | undefined) =>
    setSaid({ ...said, [field]: text });
  return {
    said,
    typeField: (field: SupplierField, text: string) => changeField({ ...deps, say }, field, text),
  };
}

// Dar de baja (con su confirmación) y reactivar.
function useDropping(deps: Omit<StateDeps, 'say' | 'ask'>) {
  const [stateSaid, say] = useState<string>(); // local: lo que pasó al dar de baja
  const [dropping, ask] = useState<Dropping | null>(null); // local: por confirmar
  const full: StateDeps = { ...deps, say, ask };
  return {
    stateSaid,
    dropping,
    deactivate: () => deactivate(full),
    confirmDeactivate: () => dropping && deactivate(full, dropping),
    cancelDeactivate: () => ask(null),
    reactivate: () => reactivate(full),
  };
}

// Lo de ahora, también para «Deshacer» y lo que termina después de otro dibujo, y cómo ponerlo.
function useCurrent(query: {
  data: SupplierResponse | undefined;
  update: (change: (now: SupplierResponse) => SupplierResponse) => void;
}) {
  const latest = useRef(query.data);
  latest.current = query.data;
  return {
    now: () => latest.current,
    put: (next: SupplierResponse) => query.update(() => next),
  };
}

export function useSupplier(id: string) {
  const may = useAccess();
  const { query, seen, part, setPart, supplier } = useShown(id, may.who);
  const { now, put } = useCurrent(query);
  const live = may.online && !!query.data;
  const [chosenDiscount, chooseDiscount] = useState<string>(); // local: el descuento elegido
  const [picks, setPicks] = useState(0); // local: elegir un archivo es de este dispositivo
  const parts = may.costs ? allParts : allParts.slice(0, 1);
  const editable = may.manage && live && !supplier?.inactive;
  const drop = useDropping({
    id,
    name: () => (now() as SupplierResponse).name,
    reload: query.invalidate,
  });
  const model = {
    supplier,
    inactive: !!supplier?.inactive,
    // La parte que se mira, si se puede ver (la del otro dispositivo puede pedir más permisos).
    part: parts.includes(part) ? part : 'data',
    ...{ live, parts, choose: setPart },
    editable,
    canDeactivate: editable && !drop.dropping,
    fields: supplier ? fieldsOf(supplier) : [],
    ...useFields({ id, now, put }),
    terms: supplier?.terms ? termsLines(supplier.terms.value) : undefined,
    ...useTerms(id, now, put),
    // El descuento que tiene el cursor: Alt ↑ ↓ lo mueven (pantalla 4).
    ...{ chosenDiscount, chooseDiscount },
    ...useLists(id, supplier?.lists),
    items: useItems(id, may.costs && part === 'items'),
    canUpload: may.load && live && !supplier?.inactive,
    upload: (files: readonly File[]) => void startUploads(files, id),
    // Cuántas veces se pidió elegir un archivo con el teclado: la vista abre la elección cada vez.
    picks,
    pick: () => setPicks(picks + 1),
    canReactivate: may.manage && live && !!supplier?.inactive,
    ...drop,
    ...{ review: openReview, back: openSuppliers, download: downloadList },
    ...{ fresh: !!query.data, failed: query.failed, retry: query.invalidate },
    seenAtShown: formatTime(seen?.at as Date),
  };
  useScreen('price-lists-supplier', model);
  return model;
}

export type Supplier = ReturnType<typeof useSupplier>;

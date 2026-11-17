// La lógica de Catálogo → Listas (08 · pantalla 1; diseño de 08, § 9): los proveedores, lo buscado y
// el filtro (que se espejan), cuántos tienen algo pendiente, los dados de baja con «Reactivar» y el
// alta con solo el nombre. Sin conexión, lo último que se vio, en gris (R1.5, E07).

import { can } from '@ferrebress/shared/contracts/can';
import type { SuppliersResponse } from '@ferrebress/shared/contracts/price-lists';
import { useState } from 'preact/hooks';
import { useLastSeen } from '../../../platform/last-seen.ts';
import { useMirroredQuery } from '../../../platform/mirror/query.ts';
import { useMirrored } from '../../../platform/mirror/use-mirrored.ts';
import { useScreen } from '../../../platform/screens.ts';
import { online as onlineStore } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { formatTime, nowMs } from '../../../platform/time.ts';
import { person as me } from '../../sign-in/index.ts';
import { suppliersApi } from '../api.ts';
import { openReview } from '../pages.ts';
import { schemas, searchText } from '../schemas.ts';
import { startUploads } from '../uploads/actions.ts';
import { useAddSupplier } from './suppliers-add.ts';
import {
  countsOf,
  filtersOf,
  nothingOf,
  type SupplierFilter,
  shownOf,
  supplierLines,
} from './suppliers-rules.ts';
import { suppliersTexts as texts } from './texts-suppliers.ts';

const none = async () => ({ ok: true as const, data: { suppliers: [] } as SuppliersResponse });

function useLists(manage: boolean, filter: SupplierFilter) {
  const active = useMirroredQuery('price-lists.suppliers', suppliersApi.list, [], {
    mode: 'refetch',
    schema: schemas.suppliers,
  });
  // Los dados de baja, solo con el filtro y con «Administrar proveedores» (R2.5).
  const wanted = manage && filter === 'inactive';
  const inactive = useMirroredQuery(
    'price-lists.suppliers.inactive',
    wanted ? suppliersApi.inactive : none,
    [wanted],
    { mode: 'refetch', schema: schemas.suppliers },
  );
  return { active, inactive };
}

function usePermissions() {
  const who = useStore(me);
  const may = (id: Parameters<typeof can>[1]) => !!who && can(who, id);
  return {
    who: who as object,
    costs: may('price-lists.costs'),
    manage: may('price-lists.suppliers'),
    load: may('price-lists.load'),
  };
}

type Seen = {
  may: ReturnType<typeof usePermissions>;
  rows: { active: SuppliersResponse | undefined; inactive: SuppliersResponse | undefined };
  search: string;
  filter: SupplierFilter;
  live: boolean;
};

// Los proveedores de una respuesta; mientras no llegó, ninguno.
const suppliersOf = (response: SuppliersResponse | undefined) => response?.suppliers ?? [];

// Lo que se ve, resuelto: los números de arriba, los filtros, los proveedores y qué se dice sin ninguno.
function viewOf({ may, rows, search, filter, live }: Seen) {
  const all = suppliersOf(rows.active);
  const counts = countsOf(all);
  const shown = shownOf(filter === 'inactive' ? suppliersOf(rows.inactive) : all, search, filter);
  const firstStep = may.load
    ? texts.empty.load
    : may.manage
      ? texts.empty.manage
      : texts.empty.none;
  return {
    total: texts.suppliers(counts.suppliers),
    filters: filtersOf(counts, filter, may.manage),
    nothing: nothingOf({ total: counts.suppliers, shown: shown.length, search, filter }, firstStep),
    suppliers: shown.map((row) => supplierLines(row, nowMs(), may.costs)),
    canAdd: may.manage && live,
    // Subir una lista, con «Cargar listas» (R1.2): sin decir de quién es o desde su renglón (R4.3).
    canUpload: may.load && live,
    // Los dados de baja se reactivan desde su filtro (R2.5).
    reactivable: filter === 'inactive' && may.manage && live,
  };
}

export function useSuppliers() {
  const may = usePermissions();
  const online = useStore(onlineStore);
  const [search, setSearch] = useMirrored('price-lists.suppliers.search', '', searchText);
  const [filter, setFilter] = useMirrored<SupplierFilter>(
    'price-lists.suppliers.filter',
    'all',
    schemas.supplierFilter,
  );
  const { active, inactive } = useLists(may.manage, filter);
  const [picks, setPicks] = useState(0); // local: elegir un archivo es de este dispositivo
  const seen = useLastSeen<SuppliersResponse>('suppliers', may.who, active.data);
  const data = active.data ?? (active.failed ? seen?.data : undefined);
  const live = online && !!active.data;
  const add = useAddSupplier(
    (row) => active.update((now) => ({ suppliers: [...now.suppliers, row] })),
    () => {
      active.invalidate();
      inactive.invalidate();
    },
  );
  const model = {
    ...viewOf({ may, rows: { active: data, inactive: inactive.data }, search, filter, live }),
    data,
    ...{ search, setSearch, live, online, ...add },
    // Tocar un filtro lo pone; tocarlo de nuevo lo saca (pantalla 1).
    toggleFilter: (next: SupplierFilter) => setFilter(filter === next ? 'all' : next),
    upload: (files: readonly File[], supplierId?: string) => void startUploads(files, supplierId),
    review: openReview,
    // Cuántas veces se pidió elegir un archivo con el teclado: la vista abre la elección cada vez.
    picks,
    pick: () => setPicks(picks + 1),
    ...{ fresh: !!active.data, failed: active.failed, retry: active.invalidate },
    seenAtShown: formatTime(seen?.at as Date),
  };
  useScreen('price-lists-suppliers', model);
  return model;
}

export type Suppliers = ReturnType<typeof useSuppliers>;

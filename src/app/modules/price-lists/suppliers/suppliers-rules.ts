// Lo que muestra Catálogo → Listas (08 · pantalla 1, R1.1), resuelto para cualquier vista: los
// proveedores que se ven según lo buscado y el filtro, cuántos hay de cada cosa y lo que se dice de
// cada uno. Sin pedidos.
import type { SupplierRow } from '@ferrebress/shared/contracts/price-lists';
import { businessDateOf } from '@ferrebress/shared/time/business';
import { plain } from '../../../platform/text.ts';
import { listReasonTexts } from '../texts-status.ts';
import { suppliersTexts as texts } from './texts-suppliers.ts';

// Todos, los que tienen una lista en espera, los que tienen una que no se pudo leer, o los dados de
// baja (R2.5).
export const supplierFilters = ['all', 'waiting', 'unreadable', 'inactive'] as const;
export type SupplierFilter = (typeof supplierFilters)[number];

const waiting = (row: SupplierRow) => row.pending?.status === 'pending';
const unreadable = (row: SupplierRow) => row.pending?.status === 'unreadable';

export const countsOf = (rows: readonly SupplierRow[]) => ({
  suppliers: rows.length,
  waiting: rows.filter(waiting).length,
  unreadable: rows.filter(unreadable).length,
});

// Por el nombre, sin acentos ni mayúsculas (R1.1), y en orden alfabético.
export function shownOf(rows: readonly SupplierRow[], search: string, filter: SupplierFilter) {
  const wanted = plain(search.trim());
  const kept =
    filter === 'waiting'
      ? rows.filter(waiting)
      : filter === 'unreadable'
        ? rows.filter(unreadable)
        : rows;
  return kept
    .filter((row) => plain(row.name).includes(wanted))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

const day = 24 * 60 * 60_000;
const ddmmyyyy = (date: string) => date.split('-').reverse().join('/');

// La fecha de la última lista aplicada y hace cuántos días, en días del negocio.
function lastListOf(date: string, now: number): string {
  const today = businessDateOf(new Date(now));
  const days = Math.max(0, Math.round((Date.parse(today) - Date.parse(date)) / day));
  return texts.lastList(ddmmyyyy(date), texts.daysAgo(days));
}

function pendingOf(row: SupplierRow): string | undefined {
  const pending = row.pending;
  if (!pending) return undefined;
  if (pending.status === 'unreadable') return texts.unreadable(listReasonTexts[pending.reason]);
  return texts.statuses[pending.status];
}

// Los enlaces de contacto, con un esquema fijo y el valor codificado (diseño de 08, § 9).
function contactOf(row: SupplierRow) {
  const digits = row.phone?.replace(/\D/g, '');
  return {
    seller: row.seller,
    note: row.note,
    phone:
      row.phone && digits
        ? { text: row.phone, tel: `tel:${digits}`, whatsapp: `https://wa.me/${digits}` }
        : undefined,
    email: row.email
      ? { text: row.email, href: `mailto:${encodeURIComponent(row.email)}` }
      : undefined,
  };
}

// Lo que se dice de un proveedor: con «Ver costos», su última lista y lo pendiente (R1.1).
export const supplierLines = (row: SupplierRow, now: number, costs: boolean) => ({
  id: row.id,
  name: row.name,
  ...contactOf(row),
  last: !costs ? undefined : row.lastListDate ? lastListOf(row.lastListDate, now) : texts.noLists,
  pending: pendingOf(row),
  problem: unreadable(row),
  // En espera: se abre ver qué cambia (pantalla 3).
  waitingList: row.pending?.status === 'pending' ? row.pending.listId : undefined,
});
export type SupplierLines = ReturnType<typeof supplierLines>;

// Qué se dice si no se ve ninguno: sin proveedores, el primer paso según los permisos; si no, por qué
// no hay ninguno con lo buscado o el filtro.
export function nothingOf(
  {
    total,
    shown,
    search,
    filter,
  }: { total: number; shown: number; search: string; filter: SupplierFilter },
  firstStep: { long: string; short: string },
): { long: string; short: string } | undefined {
  const say = (text: string) => ({ long: text, short: text });
  if (shown > 0) return undefined;
  if (filter === 'inactive') return say(texts.noInactive);
  if (total === 0) return firstStep;
  return say(search.trim() ? texts.noMatch : texts.noFiltered);
}

// Los filtros de arriba: cuántos hay en espera y cuántos no se pudieron leer, que filtran al tocarlos;
// y, con «Administrar proveedores», los dados de baja (R2.5).
export function filtersOf(
  counts: ReturnType<typeof countsOf>,
  filter: SupplierFilter,
  canSeeInactive: boolean,
) {
  return [
    { value: 'waiting' as const, label: texts.waiting(counts.waiting), shown: counts.waiting > 0 },
    {
      value: 'unreadable' as const,
      label: texts.unreadableCount(counts.unreadable),
      shown: counts.unreadable > 0,
    },
    { value: 'inactive' as const, label: texts.inactive, shown: canSeeInactive },
  ]
    .filter((option) => option.shown || option.value === filter)
    .map(({ value, label }) => ({ value, label, pressed: value === filter }));
}

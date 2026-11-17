// Lo que la pantalla de Anomalías muestra según el estado, resuelto una sola vez para cualquier vista
// (ADR-019): qué se puede hacer con cada una, qué filtros hay y qué se dice si no hay ninguna.
import {
  type AnomalyKind,
  type AnomalyStatus,
  type AnomalyView,
  anomalyKinds,
  anomalyStatuses,
} from '@ferrebress/shared/contracts/anomalies';
import type { Filter } from './schemas.ts';
import { texts } from './texts.ts';

// Qué se puede hacer con una (R9.4): marcarla con conexión si está abierta, volver a abrirla si está
// revisada; y sus filas salteadas, que se ven con «Ver costos».
export function actionsOf(anomaly: AnomalyView, live: boolean, canSeeRows: boolean) {
  const skipped = anomaly.kind === 'price-list-skipped-rows';
  return {
    review: live && anomaly.status === 'open',
    reopen: live && anomaly.status === 'reviewed',
    rows: !skipped ? ('none' as const) : canSeeRows ? ('show' as const) : ('needs-costs' as const),
  };
}

export type FilterOption<T> = { value: T; label: string; pressed: boolean };

export const filtersOf = (filter: Filter) => ({
  statuses: anomalyStatuses.map(
    (value): FilterOption<AnomalyStatus> => ({
      value,
      label: texts.statuses[value],
      pressed: filter.status === value,
    }),
  ),
  kinds: [null, ...anomalyKinds].map(
    (value): FilterOption<AnomalyKind | null> => ({
      value,
      label: value ? texts.kinds[value] : texts.allKinds,
      pressed: filter.kind === value,
    }),
  ),
});

// Sin ninguna: con el filtro de arranque, que no hay nada para revisar (E51); con otro, que no hay
// con ese filtro.
export const emptyTextOf = (filter: Filter) =>
  filter.status === 'open' && !filter.kind ? texts.empty : texts.emptyFiltered;

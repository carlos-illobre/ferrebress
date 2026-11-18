// La lógica de Anomalías (06 · pantalla 2, R9; diseño de 08, § 9): las del filtro (de arranque, las
// abiertas), de la más nueva a la más vieja, de a 30; el detalle de la elegida; marcarla revisada con
// una nota o volver a abrirla, con conexión. El filtro y la abierta se espejan; la nota es de quien
// la escribe.
import {
  type AnomaliesPage,
  type AnomalyView,
  anomalyNoteMax,
} from '@ferrebress/shared/contracts/anomalies';
import { can } from '@ferrebress/shared/contracts/can';
import { useState } from 'preact/hooks';
import { useLastSeen } from '../../platform/last-seen.ts';
import { useMirroredQuery } from '../../platform/mirror/query.ts';
import { useMirrored } from '../../platform/mirror/use-mirrored.ts';
import { useScreen } from '../../platform/screens.ts';
import { online as onlineStore } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { formatTime } from '../../platform/time.ts';
import { notify } from '../../platform/view/notify.ts';
import { openAdminPage } from '../administration/index.ts';
import { person as me } from '../sign-in/index.ts';
import { anomaliesApi } from './api.ts';
import { reopen, review } from './changes.ts';
import { useSkippedRows } from './rows.ts';
import { type Filter, filterSchema, openedSchema, pageSchema } from './schemas.ts';
import { linesOf } from './summary.ts';
import { texts } from './texts.ts';
import { actionsOf, emptyTextOf, filtersOf } from './view-rules.ts';

const params = (filter: Filter, after?: string) => ({
  status: filter.status,
  ...(filter.kind && { kind: filter.kind }),
  ...(after && { after }),
});

function usePage(who: object) {
  const [filter, setFilter] = useMirrored<Filter>(
    'anomalies.filter',
    { status: 'open', kind: null },
    filterSchema,
  );
  const query = useMirroredQuery(
    'anomalies.page',
    () => anomaliesApi.page(params(filter)),
    [filter.status, filter.kind],
    { mode: 'forward', schema: pageSchema },
  );
  const seen = useLastSeen<AnomaliesPage>('anomalies', who, query.data);
  // Cómo quedó una: si ya no es del filtro, se va de la lista.
  const put = (anomaly: AnomalyView) =>
    query.update((now) => ({
      ...now,
      anomalies: now.anomalies.flatMap((one) =>
        one.id !== anomaly.id ? [one] : anomaly.status === filter.status ? [anomaly] : [],
      ),
    }));
  const more = async () => {
    const next = query.data?.next;
    if (!next) return;
    const result = await anomaliesApi.page(params(filter, next));
    if (!result.ok) return notify(texts.loadFailed, 'triangle-alert');
    query.update((now) => ({
      ...result.data,
      anomalies: [...now.anomalies, ...result.data.anomalies],
    }));
  };
  return { filter, setFilter, query, seen, put, more };
}

// Cada una con lo que se dice de ella y si está abierta, ya resuelto.
const itemsOf = (anomalies: readonly AnomalyView[], opened: AnomalyView | undefined) =>
  anomalies.map((anomaly) => {
    const lines = linesOf(anomaly);
    const open = opened?.id === anomaly.id;
    return { anomaly, lines, open, label: texts.headLabel(lines.kind, open) };
  });

export function useAnomalies() {
  const who = useStore(me);
  const online = useStore(onlineStore);
  const { filter, setFilter, query, seen, put, more } = usePage(who as object);
  const [opened, setOpened] = useMirrored<string | null>('anomalies.opened', null, openedSchema);
  const [chosen, choose] = useState<string>(); // local: la elegida con el teclado
  const [notes, setNotes] = useState<Record<string, string>>({}); // local: la nota que se escribe
  const data = query.data ?? (query.failed ? seen?.data : undefined);
  const anomalies = data?.anomalies ?? [];
  const live = online && !!query.data;
  const openedOne = anomalies.find((one) => one.id === opened);
  const canSeeRows = !!who && can(who, 'price-lists.costs');
  const model = {
    data,
    anomalies,
    items: itemsOf(anomalies, openedOne),
    filter,
    ...{ live, online, opened: openedOne, chosen, choose, more, canSeeRows },
    rows: useSkippedRows(openedOne, canSeeRows),
    noteMax: anomalyNoteMax,
    filters: filtersOf(filter),
    empty: anomalies.length === 0 ? emptyTextOf(filter) : undefined,
    hasMore: !!data?.next && live,
    actionsOf: (anomaly: AnomalyView) => actionsOf(anomaly, live, canSeeRows),
    filterBy: (next: Partial<Filter>) => {
      setOpened(null);
      setFilter({ ...filter, ...next });
    },
    toggle: (id: string) => setOpened(opened === id ? null : id),
    noteOf: (id: string) => notes[id] ?? '',
    write: (id: string, note: string) => setNotes({ ...notes, [id]: note }),
    review: (anomaly: AnomalyView) => live && review(anomaly, notes[anomaly.id] ?? '', put),
    reopen: (anomaly: AnomalyView) => live && reopen(anomaly, put),
    chosenOne: anomalies.find((one) => one.id === chosen),
    ...{ fresh: !!query.data, failed: query.failed, retry: query.invalidate },
    seenAtShown: formatTime(seen?.at as Date),
    back: () => openAdminPage('settings'),
  };
  useScreen('anomalies', model);
  return model;
}

export type Anomalies = ReturnType<typeof useAnomalies>;

// La lógica de Lectores (08 · R5.8; diseño de 08, § 9): los lectores que trae el servidor, agrupados por
// proveedor, lo buscado (que se espeja) y activar o desactivar uno con «Deshacer», con «Cambiar los
// ajustes» y con conexión.

import { can } from '@ferrebress/shared/contracts/can';
import type { ReadersResponse, ReaderView } from '@ferrebress/shared/contracts/price-lists';
import { useLastSeen } from '../../../platform/last-seen.ts';
import { useMirroredQuery } from '../../../platform/mirror/query.ts';
import { useMirrored } from '../../../platform/mirror/use-mirrored.ts';
import { useScreen } from '../../../platform/screens.ts';
import { online as onlineStore } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { plain } from '../../../platform/text.ts';
import { dateOf, formatTime, nowMs, shownDate } from '../../../platform/time.ts';
import { notify } from '../../../platform/view/notify.ts';
import { openAdminPage } from '../../administration/index.ts';
import { person as me } from '../../sign-in/index.ts';
import { readersApi } from '../api.ts';
import { schemas, searchText } from '../schemas.ts';
import { priceListsSettings } from '../settings.ts';
import { readersTexts as texts } from './texts-readers.ts';

export type ReaderGroup = { supplier: string; readers: ReaderView[] };
const say = (text: string) => ({ long: text, short: text });

// Por proveedor, en orden; los que no tienen, primero. Lo buscado filtra por el nombre del proveedor.
export function groupsOf(readers: readonly ReaderView[], search: string): ReaderGroup[] {
  const wanted = plain(search.trim());
  const groups = new Map<string, ReaderView[]>();
  for (const reader of readers) {
    const supplier = reader.supplier?.name ?? texts.noSupplier;
    if (wanted && !plain(supplier).includes(wanted)) continue;
    groups.set(supplier, [...(groups.get(supplier) ?? []), reader]);
  }
  return [...groups].map(([supplier, list]) => ({ supplier, readers: list }));
}

// Lo que se dice de cada lector: de dónde salió, desde cuándo y su última lista.
export const readerLines = (reader: ReaderView) => ({
  origin: texts.origins[reader.origin],
  since: texts.since(dateOf(Date.parse(reader.createdAt), nowMs())),
  last: reader.lastList
    ? texts.lastList(
        reader.lastList.fileName,
        reader.lastList.listDate && shownDate(reader.lastList.listDate),
      )
    : texts.noList,
  state: reader.active ? texts.active : texts.inactive,
  toggle: reader.active ? texts.deactivate : texts.activate,
});

// Cada grupo con sus lectores y lo que se dice de cada uno, ya resuelto; y qué se dice sin ninguno, o
// sin ninguno con lo buscado.
function shownOf(all: readonly ReaderView[], search: string) {
  const groups = groupsOf(all, search);
  return {
    groups: groups.map((group) => ({
      supplier: group.supplier,
      readers: group.readers.map((reader) => ({ reader, lines: readerLines(reader) })),
    })),
    empty: all.length === 0 ? texts.empty : groups.length === 0 ? say(texts.noMatch) : undefined,
  };
}

export function useReaders() {
  const query = useMirroredQuery('price-lists.readers', readersApi.list, [], {
    mode: 'forward',
    schema: schemas.readers,
  });
  const [search, setSearch] = useMirrored('price-lists.readers.search', '', searchText);
  const who = useStore(me);
  const online = useStore(onlineStore);
  const canChange = !!who && can(who, 'settings.change');
  const seen = useLastSeen<ReadersResponse>('readers', who as object, query.data);
  const data = query.data ?? (query.failed ? seen?.data : undefined);
  const editable = canChange && online && !!query.data;
  const put = (reader: ReaderView) =>
    query.update((now) => ({
      readers: now.readers.map((one) => (one.id === reader.id ? reader : one)),
    }));
  // Activar o desactivar (R5.8, E50), con «Deshacer», que lo vuelve a como estaba.
  // El botón está solo si se puede cambiar (`editable`).
  const toggle = async (reader: ReaderView, undoing = false): Promise<void> => {
    const result = await readersApi.active(reader.id, !reader.active);
    if (!result.ok) return notify(texts.failed, 'triangle-alert');
    put(result.data);
    const origin = texts.origins[reader.origin];
    if (undoing) return;
    notify(result.data.active ? texts.activated(origin) : texts.deactivated(origin), 'check', {
      label: texts.undo,
      ms: priceListsSettings.undoMs,
      run: () => void toggle(result.data, true),
    });
  };
  const model = {
    data,
    ...shownOf(data?.readers ?? [], search),
    ...{ search, setSearch, canChange, editable, online, toggle },
    live: online && !!query.data,
    ...{ fresh: !!query.data, failed: query.failed, retry: query.invalidate },
    seenAtShown: formatTime(seen?.at as Date),
    back: () => openAdminPage('settings'),
  };
  useScreen('price-lists-readers', model);
  return model;
}

export type Readers = ReturnType<typeof useReaders>;

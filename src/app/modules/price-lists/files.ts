// La lógica de Archivos de listas (06 · pantalla 3, R10; diseño de 08, § 9): los archivos que se guardan,
// del más viejo al más nuevo, cuánto ocupan contra el espacio (E55), bajar uno y, con «Cambiar los
// ajustes» y conexión, borrarlo con «Deshacer» (R10.2, E53). El de una lista que se lee, se aplica o
// espera su turno no se borra, y se dice por qué (E54). La ve quien tiene «Ver costos» (R10.3).
import { can } from '@ferrebress/shared/contracts/can';
import type { FilesPage, ListFileView, ListStatus } from '@ferrebress/shared/contracts/price-lists';
import { useState } from 'preact/hooks';
import { useLastSeen } from '../../platform/last-seen.ts';
import { useMirroredQuery } from '../../platform/mirror/query.ts';
import { useScreen } from '../../platform/screens.ts';
import { online as onlineStore } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { formatTime, nowMs, sinceOf } from '../../platform/time.ts';
import { notify } from '../../platform/view/notify.ts';
import { saveFile } from '../../platform/view/save-file.ts';
import { openAdminPage } from '../administration/index.ts';
import { person as me } from '../sign-in/index.ts';
import { filesApi } from './api.ts';
import { schemas } from './schemas.ts';
import { priceListsSettings } from './settings.ts';
import { filesTexts as texts } from './texts-files.ts';
import { listStatusTexts } from './texts-status.ts';

const busy = new Set<ListStatus>(['queued', 'reading', 'applying']);
export const inUse = (file: ListFileView) => file.lists.some((list) => busy.has(list.status));

// En MB, con una cifra decimal debajo de 10 («0,4 MB», «80 MB»).
export function megabytes(bytes: number): string {
  const mb = bytes / 2 ** 20;
  const shown = mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb);
  return texts.megabytes(shown.toLocaleString('es-AR'));
}

// Lo que se dice de cada archivo: de qué listas es y cuándo se subió.
export const fileLines = (file: ListFileView) => ({
  lists: file.lists.map((list) => ({
    id: list.id,
    supplier: list.supplier ?? texts.noSupplier,
    name: list.fileName,
    status: listStatusTexts[list.status],
  })),
  stored: texts.stored(sinceOf(Date.parse(file.storedAt), nowMs())),
  size: megabytes(file.size),
});

const downloadErrors: Record<string, string> = {
  'file-gone': texts.fileGone,
  'too-many-downloads': texts.tooMany,
};

async function download(file: ListFileView) {
  const list = file.lists[0];
  if (!list) return;
  const result = await filesApi.download(list.id, list.fileName);
  if (result.ok) return saveFile(result.data.blob, result.data.name);
  notify(downloadErrors[result.error] ?? texts.downloadFailed, 'triangle-alert');
}

type Mark = (sha: string, deleting: boolean) => void;

function undo(file: ListFileView, mark: Mark) {
  void filesApi.restore(file.sha256).then((back) => {
    if (!back.ok) return notify(texts.failed, 'triangle-alert');
    mark(file.sha256, false);
    notify(texts.restored, 'check');
  });
}

// Borrar (R10.2): se va de la pantalla enseguida, y «Deshacer» lo trae de vuelta.
async function remove(file: ListFileView, mark: Mark): Promise<void> {
  if (inUse(file)) return notify(texts.inUse, 'triangle-alert');
  const result = await filesApi.remove(file.sha256);
  if (!result.ok)
    return notify(result.error === 'file-in-use' ? texts.inUse : texts.failed, 'triangle-alert');
  mark(file.sha256, true);
  notify(texts.removed, 'check', {
    label: texts.undo,
    ms: priceListsSettings.undoMs,
    run: () => undo(file, mark),
  });
}

function useFilesData(who: object) {
  const query = useMirroredQuery('price-lists.files', () => filesApi.page(), [], {
    mode: 'forward',
    schema: schemas.files,
  });
  const seen = useLastSeen<FilesPage>('files', who, query.data);
  const mark = (sha: string, deleting: boolean) =>
    query.update((now) => ({
      ...now,
      files: now.files.map((file) => (file.sha256 === sha ? { ...file, deleting } : file)),
    }));
  const more = async () => {
    const next = query.data?.next;
    if (!next) return;
    const result = await filesApi.page(next);
    if (!result.ok) return notify(texts.loadFailed, 'triangle-alert');
    query.update((now) => ({ ...result.data, files: [...now.files, ...result.data.files] }));
  };
  return { query, seen, mark, more };
}

export function useListFiles() {
  const who = useStore(me);
  const { query, seen, mark, more } = useFilesData(who as object);
  const online = useStore(onlineStore);
  const [chosen, choose] = useState<string>(); // local: el archivo elegido con el teclado
  const canChange = !!who && can(who, 'settings.change');
  const canSee = !!who && can(who, 'price-lists.costs');
  const data = query.data ?? (query.failed ? seen?.data : undefined);
  const live = online && !!query.data;
  const editable = canChange && live;
  const files = (data?.files ?? []).filter((file) => !file.deleting);
  const model = {
    data,
    files,
    used: data && texts.used(megabytes(data.totalBytes), megabytes(data.limitBytes)),
    ...{ canChange, canSee, editable, online, live, chosen, choose, more, download },
    remove: (file: ListFileView) => remove(file, mark),
    chosenFile: files.find((file) => file.sha256 === chosen),
    // Si se puede borrar (R10.2, E54): sí, no porque su lista se lee o se aplica (se dice), o no.
    removable: (file: ListFileView) =>
      !editable ? ('no' as const) : inUse(file) ? ('in-use' as const) : ('yes' as const),
    ...{ fresh: !!query.data, failed: query.failed, retry: query.invalidate },
    seenAtShown: formatTime(seen?.at as Date),
    back: () => openAdminPage('settings'),
  };
  useScreen('price-lists-files', model);
  return model;
}

export type ListFiles = ReturnType<typeof useListFiles>;
export type { ListFileView };

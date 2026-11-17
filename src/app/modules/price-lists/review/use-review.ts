// Los datos de ver qué cambia (08 · pantalla 3; diseño de 08, § 9): el estado de la lista, el filtro, lo
// buscado y el detalle de a 50 (que se espejan), y mientras se aplica, su avance por el tema
// `price-lists.list`.
import type { ListProgress, ListState, RowsPage } from '@ferrebress/shared/contracts/price-lists';
import { useState } from 'preact/hooks';
import { useMirroredQuery } from '../../../platform/mirror/query.ts';
import { useMirrored } from '../../../platform/mirror/use-mirrored.ts';
import { useTopic } from '../../../platform/realtime/use-topic.ts';
import { notify } from '../../../platform/view/notify.ts';
import { listsApi } from '../api.ts';
import { reviewSchemas, searchText } from '../schemas.ts';
import type { Show } from './rules.ts';
import { reviewTexts as texts } from './texts.ts';

export function useListData(listId: string) {
  const state = useMirroredQuery('price-lists.review', () => listsApi.one(listId), [listId], {
    mode: 'forward',
    schema: reviewSchemas.state,
  });
  const [show, setShow] = useMirrored<Show>('price-lists.review.show', null, reviewSchemas.show);
  const [search, setSearch] = useMirrored('price-lists.review.search', '', searchText);
  // Lo que se pide del detalle: el filtro, lo buscado y, para la página siguiente, desde dónde.
  const params = (after?: string) => ({
    ...(show && { show }),
    q: search.trim(),
    ...(after && { after }),
  });
  const rows = useMirroredQuery(
    'price-lists.review.rows',
    () => listsApi.rows(listId, params()),
    [listId, show, search],
    { mode: 'forward', schema: reviewSchemas.rows },
  );
  // Se ofrece solo si hay más: `next` está.
  const more = async () => {
    const result = await listsApi.rows(listId, params(rows.data?.next as string));
    if (!result.ok) return notify(texts.rowsFailed, 'triangle-alert');
    rows.update((now: RowsPage) => ({ ...result.data, rows: [...now.rows, ...result.data.rows] }));
  };
  return { state, show, setShow, search, setSearch, rows, more };
}

// Mientras se aplica, el avance por el tema; cuando deja de aplicarse, se trae el estado entero (con
// lo que hizo, o el motivo si volvió a esperar).
export function useApplying(listId: string, state: ListState | undefined, reload: () => void) {
  const [progress, setProgress] = useState<ListProgress>(); // local: el avance que llega
  const applying = state?.status === 'applying';
  useTopic(applying ? `price-lists.list:${listId}` : undefined, {
    onEvent: (data) => {
      const now = data as ListProgress;
      setProgress(now);
      if (now.status !== 'applying') reload();
    },
  });
  return applying ? progress : undefined;
}

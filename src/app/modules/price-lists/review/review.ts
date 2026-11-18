// El modelo de ver qué cambia y aplicar (08 · pantalla 3; ADR-019): lo que se ve de la lista, el
// detalle con la cuenta de cada costo, y aplicar, cancelar mientras se aplica, descartar y bajar el
// archivo, con «Cargar listas» y conexión. Sin conexión, lo último que se vio, en gris.

import { can } from '@ferrebress/shared/contracts/can';
import type { ListState } from '@ferrebress/shared/contracts/price-lists';
import { useState } from 'preact/hooks';
import { useLastSeen } from '../../../platform/last-seen.ts';
import { useScreen } from '../../../platform/screens.ts';
import { online as onlineStore } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { formatTime } from '../../../platform/time.ts';
import { person as me } from '../../sign-in/index.ts';
import { downloadList } from '../download.ts';
import { openSuppliers } from '../pages.ts';
import { apply, cancelApply, discard } from './actions.ts';
import { rowLines, type Show, viewOf } from './rules.ts';
import { reviewTexts as texts } from './texts.ts';
import { useApplying, useListData } from './use-review.ts';

function usePerson(state: ListState | undefined) {
  const person = useStore(me);
  const online = useStore(onlineStore);
  return {
    online,
    canLoad: !!person && can(person, 'price-lists.load'),
    seen: useLastSeen<ListState>('review', person as object, state),
  };
}

export function useReview(listId: string) {
  const data = useListData(listId);
  const { online, canLoad, seen } = usePerson(data.state.data);
  const [said, say] = useState<string>(); // local: lo que pasó al intentar algo
  const [opened, setOpened] = useState<string>(); // local: la cuenta que se mira
  const reload = () => {
    data.state.invalidate();
    data.rows.invalidate();
  };
  const progress = useApplying(listId, data.state.data, reload);
  const state = data.state.data ?? (data.state.failed ? seen?.data : undefined);
  const live = online && !!data.state.data;
  const deps = { listId, put: (now: ListState) => data.state.update(() => now), reload, say };
  const may = live && canLoad;
  const model = {
    state,
    view: state && viewOf(state, progress, data.show),
    rows: (data.rows.data?.rows ?? []).map(rowLines),
    hasMore: !!data.rows.data?.next,
    flagged: (data.flagged?.data?.rows ?? []).map(rowLines),
    // Si hay más para revisar que los que se ven arriba, se ven todos con su filtro.
    moreFlagged: !!data.flagged?.data?.next,
    allFlagged: () => data.setShow('review'),
    ...{ said, live, search: data.search, setSearch: data.setSearch, more: data.more },
    toggleShow: (value: Show) => data.setShow(data.show === value ? null : value),
    isOpen: (key: string) => opened === key,
    costLabel: (key: string) => (opened === key ? texts.hideCost : texts.howCost),
    toggleCost: (key: string) => setOpened(opened === key ? undefined : key),
    canApply: may && state?.status === 'pending' && !!state.summary && !state.summary.tooOld,
    canDiscard: may && state?.status === 'pending',
    canCancel: may && state?.status === 'applying',
    apply: () => apply(deps, state?.summary as NonNullable<ListState['summary']>),
    discard: () => discard(deps),
    cancel: () => cancelApply(deps),
    download: () => downloadList(listId, state?.fileName as string),
    back: openSuppliers,
    ...{ fresh: !!data.state.data, failed: data.state.failed, retry: reload },
    seenAtShown: formatTime(seen?.at as Date),
  };
  useScreen('price-lists-review', model);
  return model;
}

export type Review = ReturnType<typeof useReview>;

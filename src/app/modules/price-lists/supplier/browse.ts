// Las listas y los productos de un proveedor (08 · R6.7, R8), con «Ver costos»: las listas, las 20
// más nuevas con el proveedor y las anteriores al pedirlas; los productos, de a 50, con lo buscado y
// si se ven los que vienen o los dados de baja (que se espejan), cada costo con su cuenta.
import type {
  ItemsPage,
  SupplierList,
  SupplierListsPage,
} from '@ferrebress/shared/contracts/price-lists';
import { useState } from 'preact/hooks';
import * as z from 'zod/mini';
import { useMirroredQuery } from '../../../platform/mirror/query.ts';
import { useMirrored } from '../../../platform/mirror/use-mirrored.ts';
import { notify } from '../../../platform/view/notify.ts';
import { suppliersApi } from '../api.ts';
import { searchText, supplierSchemas } from '../schemas.ts';
import { itemLines, listLines } from './rules.ts';
import { supplierTexts as texts } from './texts.ts';

export function useLists(id: string, first: SupplierListsPage | undefined) {
  const [older, setOlder] = useState<SupplierListsPage>(); // local: las anteriores que se pidieron
  const lists: SupplierList[] = [...(first?.lists ?? []), ...(older?.lists ?? [])];
  const next = older ? older.next : first?.next;
  const more = async () => {
    const result = await suppliersApi.lists(id, next as string);
    if (!result.ok) return notify(texts.failed, 'triangle-alert');
    setOlder({ ...result.data, lists: [...(older?.lists ?? []), ...result.data.lists] });
  };
  return {
    lists: lists.map(listLines),
    listsEmpty: lists.length === 0 ? texts.noLists : undefined,
    hasMoreLists: !!next,
    moreLists: more,
  };
}

export function useItems(id: string, wanted: boolean) {
  const [search, setSearch] = useMirrored('price-lists.supplier.search', '', searchText);
  const [discontinued, setDiscontinued] = useMirrored(
    'price-lists.supplier.discontinued',
    false,
    z.boolean(),
  );
  const [opened, setOpened] = useState<number>(); // local: la cuenta que se mira
  const none = async () => ({ ok: true as const, data: { items: [] } as ItemsPage });
  const params = (after?: string) => ({ q: search.trim(), discontinued, ...(after && { after }) });
  const query = useMirroredQuery(
    'price-lists.supplier.items',
    wanted ? () => suppliersApi.items(id, params()) : none,
    [id, wanted, search, discontinued],
    { mode: 'forward', schema: supplierSchemas.items },
  );
  // Se ofrece solo si hay más: `next` está.
  const more = async () => {
    const result = await suppliersApi.items(id, params(query.data?.next as string));
    if (!result.ok) return notify(texts.failed, 'triangle-alert');
    query.update((now) => ({ ...result.data, items: [...now.items, ...result.data.items] }));
  };
  return {
    shown: (query.data?.items ?? []).map(itemLines),
    empty: (query.data?.items ?? []).length === 0 ? texts.noItems : undefined,
    hasMore: !!query.data?.next,
    ...{ search, setSearch, discontinued, setDiscontinued, more },
    isOpen: (index: number) => opened === index,
    costLabel: (index: number) => (opened === index ? texts.hideCost : texts.howCost),
    toggleCost: (index: number) => setOpened(opened === index ? undefined : index),
  };
}

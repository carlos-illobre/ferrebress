// Dar de alta un proveedor con solo su nombre (R2.2), desde Catálogo → Listas: el nombre repetido se
// rechaza en el lugar (E10) y el de uno dado de baja ofrece «Reactivar» (E94).
import type { SupplierExists, SupplierRow } from '@ferrebress/shared/contracts/price-lists';
import { useState } from 'preact/hooks';
import { notify } from '../../../platform/view/notify.ts';
import { suppliersApi } from '../api.ts';
import { suppliersTexts as texts } from './texts-suppliers.ts';

export type Adding = { name: string; error?: string; inactiveId?: string };

const errors: Record<string, string> = {
  'supplier-exists': texts.exists,
  'invalid-field': texts.invalidName,
};

// Lo que se dice si no se pudo dar de alta; si está dado de baja, cuál, para reactivarlo.
function refusedWith(adding: Adding, refusal: { error: string; id?: string }): Adding {
  if (refusal.error === 'supplier-inactive')
    return { ...adding, error: texts.existsInactive, inactiveId: refusal.id as string };
  return { name: adding.name, error: errors[refusal.error] ?? texts.failed };
}

export function useAddSupplier(added: (row: SupplierRow) => void, reactivated: () => void) {
  const [adding, setAdding] = useState<Adding | null>(null); // local: lo que escribe quien da de alta
  const create = async () => {
    if (!adding) return;
    const result = await suppliersApi.create(adding.name);
    if (result.ok) {
      setAdding(null);
      added({ id: result.data.id, name: result.data.name });
      return notify(texts.created(result.data.name), 'check');
    }
    setAdding(refusedWith(adding, result as unknown as SupplierExists & { id?: string }));
  };
  const reactivate = async (id: string, name: string) => {
    const result = await suppliersApi.reactivate(id);
    if (!result.ok) return notify(texts.failed, 'triangle-alert');
    setAdding(null);
    reactivated();
    notify(texts.reactivated(name), 'check');
  };
  return {
    adding,
    startAdding: () => setAdding({ name: '' }),
    stopAdding: () => setAdding(null),
    typeName: (name: string) => setAdding({ name }),
    create,
    reactivate,
  };
}

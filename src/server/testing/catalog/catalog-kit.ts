// Para probar el catálogo (capítulo 07) desde la aplicación: el kit de las listas, con quien cambia
// márgenes y quien cambia los datos de un producto, listas de verdad que crean y cambian productos, y
// los cambios como los manda la aplicación.
import type { ProductRow } from '@ferrebress/shared/contracts/catalog';
import type { ListState } from '@ferrebress/shared/contracts/price-lists';
import { sql } from 'kysely';
import { createListsKit } from '../price-lists/lists-kit.ts';
import { xlsx } from '../price-lists/sheets.ts';

type Device = Awaited<ReturnType<typeof createListsKit>>['admin'];
// Una fila: código, descripción, precio y, si se quiere, IVA, marca y código de barras.
export type Row = [string, string, number, (number | string)?, string?, string?];

const sheetOf = (rows: Row[]) =>
  xlsx([
    ['Lista'],
    ['Código', 'Descripción', 'Precio', 'IVA', 'Marca', 'Código de barras'],
    ...rows.map(([code, description, price, vat = '', brand = '', barcode = '']) => [
      ...[code, description, price],
      ...[vat, brand, barcode],
    ]),
  ]);

type ListsKit = Awaited<ReturnType<typeof createListsKit>>;

// Sube una lista de ese proveedor y la aplica con los números que dice su resumen.
async function applyList(
  kit: ListsKit,
  supplierId: string,
  rows: Row[],
  scope: 'full' | 'partial' = 'full',
) {
  // Fuera del límite de subidas por minuto.
  kit.later(61_000);
  const sent = await kit.upload(sheetOf(rows), { supplierId, scope });
  const id = sent.body.id as string;
  const { summary } = (await kit.list(id)) as Required<ListState>;
  const expected = { new: summary.new, changed: summary.changed, gone: summary.gone };
  await kit.loader.device.request(`/api/price-lists/lists/${id}/apply`, { expected });
  await kit.server.priceLists.idle();
  await kit.server.catalog.indexed();
  return id;
}

// El producto de un código de ese proveedor.
const idOf = async (kit: ListsKit, supplierId: string, code: string) =>
  (
    await sql<{ id: string }>`select product_id as id from price_lists.items
      where supplier_id = ${supplierId} and supplier_code = ${code}`.execute(kit.server.platform.db)
  ).rows[0]?.id as string;

// El paso del redondeo, confirmando cuántos precios cambian.
async function setStep(kit: ListsKit, stepCents: number) {
  const now = (await kit.admin.request('/api/administration')).body.settings.roundingStep;
  await kit.reconfirm();
  const body = { value: stepCents, version: now.version };
  // Sin precios que cambien, se guarda en el primero y el segundo ya no cambia nada.
  const first = await kit.admin.request('/api/administration/settings/roundingStep', body);
  return kit.admin.request('/api/administration/settings/roundingStep', {
    ...body,
    confirmed: first.body.prices,
  });
}

// Los cambios y las consultas como los manda la aplicación.
function requests(kit: ListsKit, margins: Device, editor: Device) {
  // Y espera que la búsqueda tenga el cambio.
  const change = async (
    field: 'margin' | 'unit' | 'vat',
    id: string,
    body: object,
    device: Device,
  ) => {
    const sent = await device.request(`/api/catalog/products/${id}/${field}`, body);
    await kit.server.catalog.indexed();
    return sent;
  };
  return {
    product: async (
      id: string,
      device: Device = kit.admin,
    ): Promise<ProductRow & Record<string, unknown>> =>
      (await device.request(`/api/catalog/products/${id}`)).body,
    setMargin: (id: string, before: number | null, value: number | null, device = margins) =>
      change('margin', id, { before, value }, device),
    setUnit: (id: string, before: string, value: string, device = editor) =>
      change('unit', id, { before, value }, device),
    setVat: (
      id: string,
      body: { before: number; value: number; manual?: boolean },
      device = editor,
    ) => change('vat', id, body, device),
    search: async (query: Record<string, string> = {}, device: Device = kit.admin) =>
      (await device.request(`/api/catalog/products?${new URLSearchParams(query)}`)).body,
  };
}

export async function createCatalogKit() {
  const kit = await createListsKit();
  const as = async (name: string, permissions: string[]) =>
    kit.person([await kit.role(name, permissions)]);
  const margins = await as('Márgenes', ['catalog.margins']);
  const editor = await as('Datos de productos', ['catalog.products']);
  return {
    ...kit,
    margins,
    editor,
    applyList: (supplierId: string, rows: Row[], scope?: 'full' | 'partial') =>
      applyList(kit, supplierId, rows, scope),
    idOf: (supplierId: string, code: string) => idOf(kit, supplierId, code),
    setStep: (stepCents: number) => setStep(kit, stepCents),
    ...requests(kit, margins.device, editor.device),
  };
}

export type CatalogKit = Awaited<ReturnType<typeof createCatalogKit>>;

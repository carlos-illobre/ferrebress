// Para probar subir y leer listas desde la aplicación (08 · R4, R5): el kit de las listas con los
// archivos en una carpeta (el proceso lector los lee del disco), una carpeta de lectores de un
// programador propia de la prueba, y subir una planilla como lo hace la aplicación.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import type { ListState } from '@ferrebress/shared/contracts/price-lists';
import { sql } from 'kysely';
import type { PoolOptions } from '../../modules/price-lists/reading/pool.ts';
import { priceListsSettings } from '../../modules/price-lists/settings.ts';
import { appHeaders, testConfig } from '../config.ts';
import { createPriceListsKit } from './price-lists-kit.ts';

type Device = Awaited<ReturnType<typeof createPriceListsKit>>['admin'];
type Query = { name?: string; supplierId?: string; scope?: 'full' | 'partial' };

type Kit = Awaited<ReturnType<typeof createPriceListsKit>>;

// Sube por partes, sin decir el largo (como un navegador que lo manda de a trozos): el tope y el
// corte por falta de datos se miran mientras llega.
async function uploadStream(kit: Kit, parts: AsyncIterable<Uint8Array>, name: string) {
  const device = kit.loader.device as unknown as { id: string; cookie: string };
  const response = await kit.server.http.request(
    `/api/price-lists/lists?name=${name}`,
    {
      method: 'POST',
      body: Readable.toWeb(Readable.from(parts)),
      duplex: 'half',
      headers: {
        ...appHeaders(device.id),
        Cookie: device.cookie,
        Origin: testConfig.PUBLIC_ORIGIN,
        'Content-Type': 'application/octet-stream',
      },
    } as RequestInit,
    { incoming: { socket: { remoteAddress: testConfig.TRUSTED_PROXY } } },
  );
  return { status: response.status, body: await response.json() };
}

// Lo que quedó: las filas de una lista, las anomalías, y cambiar un ajuste.
const looks = (kit: Kit) => ({
  rows: async (listId: string) =>
    (
      await sql<{
        code: string | null;
        cost: string | null;
        change: string | null;
        skipped: string | null;
      }>`
        select supplier_code as code, cost::text, change, skipped from price_lists.list_rows
        where list_id = ${listId} order by sheet, row`.execute(kit.server.platform.db)
    ).rows,
  setting: async (key: string, value: number) => {
    const { version } = (await kit.admin.request('/api/administration')).body.settings[key];
    return kit.admin.request(`/api/administration/settings/${key}`, { value, version });
  },
  anomaliesOf: async () => (await kit.admin.request('/api/anomalies')).body.anomalies,
});

export async function createListsKit(pool: Partial<PoolOptions> = {}) {
  // Los procesos lectores de este archivo de pruebas.
  Object.assign(priceListsSettings.pool, { stallMs: 20_000, ...pool });
  const readersDir = mkdtempSync(join(tmpdir(), 'lectores-'));
  const kit = await createPriceListsKit({
    filesPath: mkdtempSync(join(tmpdir(), 'archivos-')),
    priceLists: {
      readersDir: pathToFileURL(`${readersDir}/`),
    },
  });
  return {
    ...kit,
    readersDir,
    // Sube una planilla y espera que termine de leerse.
    // Cada una, un segundo después de la anterior: la más nueva es la que vale (R4.8).
    async upload(file: Uint8Array, query: Query = {}, device: Device = kit.loader.device) {
      kit.later(1000);
      const params = new URLSearchParams({ name: 'lista.xlsx', ...query });
      const sent = await device.request(`/api/price-lists/lists?${params}`, file, {
        'Content-Type': 'application/octet-stream',
      });
      await kit.server.priceLists.idle();
      return sent;
    },
    uploadStream: (parts: AsyncIterable<Uint8Array>, name = 'lista.csv') =>
      uploadStream(kit, parts, name),
    list: async (id: string): Promise<ListState> =>
      (await kit.admin.request(`/api/price-lists/lists/${id}`)).body,
    // Un lector de un programador, en su carpeta.
    addReader: (name: string, code: string) => writeFileSync(join(readersDir, name), code),
    ...looks(kit),
  };
}

export type ListsKit = Awaited<ReturnType<typeof createListsKit>>;

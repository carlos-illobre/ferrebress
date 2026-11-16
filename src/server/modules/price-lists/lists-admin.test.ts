// Lectores y Archivos de listas en Administración (08 · R5.8; 06 · R10), bajar el archivo original
// (08 · R4.4, E40) y lo que se borra solo (06 · R8.6, R8.7; diseño de 08, § 8).
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { appHeaders, testConfig } from '../../testing/config.ts';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

type Rows = (string | number)[][];
const sheet = (title: string, rows: Rows) =>
  xlsx([[title], ['Código', 'Descripción', 'Precio'], ...rows]);

describe('lectores y archivos', () => {
  let kit: ListsKit;
  beforeAll(async () => {
    kit = await createListsKit();
  });
  afterAll(() => kit.server.close());
  beforeEach(() => kit.later(61_000));

  const apply = async (id: string, expected: object) => {
    await kit.loader.device.request(`/api/price-lists/lists/${id}/apply`, { expected });
    await kit.server.priceLists.idle();
  };
  // Bajar un archivo sin leerlo todavía: la respuesta tal cual.
  const fetchFile = (listId: string, device = kit.viewer.device) => {
    const { id, cookie } = device as unknown as { id: string; cookie: string };
    return kit.server.http.request(
      `/api/price-lists/lists/${listId}/file`,
      { headers: { ...appHeaders(id), Cookie: cookie } },
      { incoming: { socket: { remoteAddress: testConfig.TRUSTED_PROXY } } },
    );
  };

  it('price-lists-E44, E50 y E51: los lectores los ve cualquiera; desactivar uno lo deja de usar desde la planilla siguiente', async () => {
    const supplierId = await kit.supplier('Bulonera Centro');
    const format = (n: number) => sheet('Lista', [['A1', 'Mecha', n]]);
    const first = await kit.upload(format(10), { supplierId });
    await apply(first.body.id, { new: 1, changed: 0, gone: 0 });
    const readers = (await kit.seller.device.request('/api/price-lists/readers')).body.readers;
    const reader = readers.find(
      (one: { supplier?: { id: string } }) => one.supplier?.id === supplierId,
    );
    expect(reader).toMatchObject({
      origin: 'auto',
      active: true,
      supplier: { name: 'Bulonera Centro' },
      lastList: { id: first.body.id, fileName: 'lista.xlsx' },
    });
    expect(
      (
        await kit.seller.device.request(`/api/price-lists/readers/${reader.id}/active`, {
          active: false,
        })
      ).body,
    ).toMatchObject({
      error: 'forbidden',
      permission: 'settings.change',
    });
    const off = await kit.admin.request(`/api/price-lists/readers/${reader.id}/active`, {
      active: false,
    });
    expect(off.body).toMatchObject({ active: false });
    expect(kit.audited('readers.deactivated').at(-1)?.data).toEqual({
      origin: 'auto',
      supplier: 'Bulonera Centro',
    });
    const next = await kit.upload(format(11), { supplierId });
    expect(await kit.list(next.body.id)).toMatchObject({ newReader: true });
    // El nuevo espera su lista: no se activa a mano.
    const pending = await sql<{
      id: string;
    }>`select id from price_lists.readers where pending_list_id = ${next.body.id}`.execute(
      kit.server.platform.db,
    );
    expect(
      (
        await kit.admin.request(`/api/price-lists/readers/${pending.rows[0]?.id}/active`, {
          active: true,
        })
      ).body,
    ).toEqual({ error: 'reader-pending' });
    expect(
      (await kit.admin.request(`/api/price-lists/readers/${reader.id}/active`, { active: true }))
        .body.active,
    ).toBe(true);
    expect(kit.audited('readers.activated')).toHaveLength(1);
    expect(
      (await kit.admin.request(`/api/price-lists/readers/${kit.uuid()}/active`, { active: true }))
        .status,
    ).toBe(404);
  });

  it('price-lists-R5.1 y E93: uno de un programador se asocia a un proveedor, y lo que no se pudo leer se vuelve a leer', async () => {
    const supplierId = await kit.supplier('Aceros Sur');
    const sent = await kit.upload(xlsx([['FORMATO P'], ['P1', 'Pala', 100]]), { supplierId });
    expect(await kit.list(sent.body.id)).toMatchObject({ status: 'unreadable' });
    kit.addReader(
      'formato-p.js',
      `globalThis.reader = {
      recognizes: (head) => head[0].rows[0]?.[0]?.t === 'FORMATO P' ? 'yes' : 'no',
      read: (block) => block.rows.map((row, i) => { const r = block.start + i;
        return r === 0 ? { row: r, kind: 'title' } : { row: r, kind: 'product', at: { code: [r, 0], description: [r, 1], price: [r, 2] } }; }),
    };`,
    );
    await sql`update price_lists.lists set status = 'discarded' where id = ${sent.body.id}`.execute(
      kit.server.platform.db,
    );
    await kit.server.priceLists.resume();
    await sql`update price_lists.lists set status = 'unreadable' where id = ${sent.body.id}`.execute(
      kit.server.platform.db,
    );
    const programmer = (await kit.admin.request('/api/price-lists/readers')).body.readers.find(
      (one: { origin: string }) => one.origin === 'programmer',
    );
    expect(programmer.supplier).toBeUndefined();
    const assigned = await kit.admin.request(`/api/price-lists/readers/${programmer.id}/supplier`, {
      supplierId,
    });
    expect(assigned.body).toMatchObject({ supplier: { id: supplierId, name: 'Aceros Sur' } });
    await kit.server.priceLists.idle();
    expect(await kit.list(sent.body.id)).toMatchObject({ status: 'pending' });
    expect(kit.audited('readers.assigned').at(-1)?.targets).toEqual([
      { kind: 'reader', id: programmer.id },
      { kind: 'supplier', id: supplierId, name: 'Aceros Sur' },
    ]);
    expect(
      (
        await kit.admin.request(`/api/price-lists/readers/${programmer.id}/supplier`, {
          supplierId: kit.uuid(),
        })
      ).status,
    ).toBe(404);
  });

  it('price-lists-E40 y administration-E53 a E55: bajar el original; borrarlo a mano con «Deshacer»; el de una que se lee, no', async () => {
    const supplierId = await kit.supplier('Corralón Norte');
    const file = sheet('Lista', [['A1', 'Mecha', 77]]);
    const sent = await kit.upload(file, { supplierId, name: 'Lista Ñandú.xlsx' });
    const got = await fetchFile(sent.body.id);
    expect(Buffer.from(await got.arrayBuffer()).equals(Buffer.from(file))).toBe(true);
    expect(got.headers.get('Content-Disposition')).toContain(
      "filename*=UTF-8''Lista%20%C3%91and%C3%BA.xlsx",
    );
    const page = (await kit.viewer.device.request('/api/price-lists/files')).body;
    const mine = page.files.find((one: { lists: { id: string }[] }) =>
      one.lists.some((list) => list.id === sent.body.id),
    );
    expect(mine).toMatchObject({
      size: file.length,
      deleting: false,
      lists: [{ status: 'pending', supplier: 'Corralón Norte' }],
    });
    expect(page).toMatchObject({ totalBytes: expect.any(Number), limitBytes: 100 * 2 ** 20 });
    expect(
      (await kit.viewer.device.request(`/api/price-lists/files/${mine.sha256}/delete`, {})).status,
    ).toBe(403);
    expect(
      (await kit.admin.request(`/api/price-lists/files/${mine.sha256}/delete`, {})).body,
    ).toEqual({ ok: true });
    expect(await kit.list(sent.body.id)).toMatchObject({ file: false });
    expect((await fetchFile(sent.body.id)).status).toBe(410);
    expect(
      (await kit.admin.request(`/api/price-lists/files/${mine.sha256}/restore`, {})).body,
    ).toEqual({ ok: true });
    expect(await kit.list(sent.body.id)).toMatchObject({ file: true });
    expect(
      (await kit.admin.request(`/api/price-lists/files/${mine.sha256}/restore`, {})).status,
    ).toBe(404);
    await kit.admin.request(`/api/price-lists/files/${mine.sha256}/delete`, {});
    kit.later(10_000);
    await kit.server.runJobs();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await kit.server.platform.files.list()).not.toContain(mine.sha256);
    expect(kit.audited('files.deleted').length).toBeGreaterThan(0);
    expect(kit.audited('files.restored')).toHaveLength(1);
    const waiting = await kit.upload(
      xlsx([['Lista'], ['Artículo', 'Detalle', 'Lista'], ['X1', 'Pala', 1]]),
    );
    const busy = (await kit.viewer.device.request('/api/price-lists/files')).body.files.find(
      (one: { lists: { id: string }[] }) => one.lists.some((list) => list.id === waiting.body.id),
    );
    expect(
      (await kit.admin.request(`/api/price-lists/files/${busy.sha256}/delete`, {})).body,
    ).toEqual({ error: 'file-in-use' });
    expect(
      (await kit.admin.request(`/api/price-lists/files/${'0'.repeat(64)}/delete`, {})).status,
    ).toBe(404);
    expect((await kit.admin.request('/api/price-lists/files/nada/delete', {})).status).toBe(404);
    expect((await kit.viewer.device.request('/api/price-lists/files?after=nada')).status).toBe(400);
    expect((await fetchFile(kit.uuid())).status).toBe(404);
  });

  it('bajar archivos, 2 a la vez por persona', async () => {
    const sent = await kit.upload(sheet('Lista', [['A1', 'Mecha', 10]]), {
      supplierId: await kit.supplier('Pinturería Oeste'),
    });
    const [one, two] = [await fetchFile(sent.body.id), await fetchFile(sent.body.id)];
    expect((await fetchFile(sent.body.id)).status).toBe(429);
    await one.arrayBuffer();
    await two.body?.cancel();
    expect((await fetchFile(sent.body.id)).status).toBe(200);
  });

  it('administration-R10.1: los archivos, de a 50, del más viejo al más nuevo', async () => {
    const db = kit.server.platform.db;
    for (let i = 0; i < 51; i++)
      await sql`insert into price_lists.files (sha256, size, stored_at) values
        (decode(${i.toString(16).padStart(64, 'f')}, 'hex'), 10, ${new Date(Date.UTC(2020, 0, 1, 0, i))})`.execute(
        db,
      );
    const first = (await kit.viewer.device.request('/api/price-lists/files')).body;
    expect(first.files).toHaveLength(50);
    expect(first.files[0]).toMatchObject({
      size: 10,
      lists: [],
      storedAt: '2020-01-01T00:00:00.000Z',
    });
    const rest = (await kit.viewer.device.request(`/api/price-lists/files?after=${first.next}`))
      .body;
    expect(rest.files[0].storedAt).toBe('2020-01-01T00:50:00.000Z');
    await sql`delete from price_lists.files where size = 10`.execute(db);
  });
});

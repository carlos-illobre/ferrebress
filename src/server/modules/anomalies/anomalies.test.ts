// Las anomalías desde la aplicación (06 · R9; diseño de 08, § 3): verlas, marcarlas revisadas y
// volver a abrirlas con «Revisar las anomalías», el número de la cabecera y lo que abre y cierra
// cada capítulo por la fachada.
import { parseServerHeader } from '@ferrebress/shared/contracts/server-header';
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRolesKit, type RolesKit } from '../../testing/users/roles-kit.ts';
import type { OpenAnomaly } from './index.ts';

describe('las anomalías', () => {
  let kit: RolesKit;
  let seller: Awaited<ReturnType<RolesKit['person']>>;
  let count = 0;

  beforeAll(async () => {
    kit = await createRolesKit();
    seller = await kit.person([await kit.role('Mostrador', ['users.view'])]);
  });
  afterAll(() => kit.server.close());
  beforeEach(async () => {
    await sql`delete from anomalies.anomalies`.execute(kit.server.platform.db);
    // Cerrar algo que no existe vuelve a contar las abiertas: la memoria queda en cero.
    await kit.server.platform.db
      .transaction()
      .execute(async (trx) => (await kit.server.anomalies.close(trx, 'nada'))());
  });

  const subject = () => `price-lists:list:${++count}`;
  const unreadable = (on = subject()): OpenAnomaly => ({
    kind: 'price-list-unreadable',
    subject: on,
    summary: { file: 'lista.xlsx', reason: 'no-reader' },
  });
  const open = (anomaly: OpenAnomaly) =>
    kit.server.platform.db
      .transaction()
      .execute(async (trx) => kit.server.anomalies.open(trx, anomaly))
      .then((then) => then());
  const close = (on: string, kind?: OpenAnomaly['kind']) =>
    kit.server.platform.db
      .transaction()
      .execute(async (trx) => kit.server.anomalies.close(trx, on, kind))
      .then((then) => then());
  const list = async (query = '', device = kit.admin) => device.request(`/api/anomalies${query}`);
  const openCount = (header: string | null) => parseServerHeader(header)?.fields?.a;

  it('administration-E46: sin «Revisar las anomalías» el servidor rechaza verlas y marcarlas', async () => {
    await open(unreadable());
    const id = (await list()).body.anomalies[0].id;
    const seen = await list('', seller.device);
    expect(seen.status).toBe(403);
    expect(seen.body).toMatchObject({ error: 'forbidden', permission: 'anomalies.review' });
    expect((await seller.device.request(`/api/anomalies/${id}/review`, {})).status).toBe(403);
    const denied = kit.audited('permission.denied').at(-1);
    expect(denied?.data).toMatchObject({ permission: 'anomalies.review' });
  });

  it('administration-E47: con dos abiertas, la cabecera dice 2, solo a quien tiene el permiso', async () => {
    await open(unreadable());
    await open(unreadable());
    expect(openCount((await list()).header)).toBe('2');
    expect(openCount((await kit.admin.request('/api/administration')).header)).toBe('2');
    expect(openCount((await seller.device.request('/api/administration')).header)).toBeUndefined();
  });

  it('administration-E51: sin abiertas, la lista está vacía y la cabecera no trae número', async () => {
    const seen = await list();
    expect(seen.body).toEqual({ anomalies: [] });
    expect(openCount(seen.header)).toBeUndefined();
  });

  it('administration-E48: revisada con una nota, deja las abiertas, baja el número y va a Quién hizo qué', async () => {
    await open(unreadable());
    await open(unreadable());
    const [first] = (await list()).body.anomalies;
    const reviewed = await kit.admin.request(`/api/anomalies/${first.id}/review`, {
      note: '  Le escribí al proveedor  ',
    });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body).toMatchObject({
      id: first.id,
      status: 'reviewed',
      note: 'Le escribí al proveedor',
      reviewedBy: { id: kit.adminId },
    });
    expect(openCount(reviewed.header)).toBe('1');
    expect((await list()).body.anomalies.map((one: { id: string }) => one.id)).not.toContain(
      first.id,
    );
    const event = kit.audited('anomalies.reviewed').at(-1);
    expect(event).toMatchObject({
      targets: [{ kind: 'anomaly', id: first.id }],
      data: { kind: 'price-list-unreadable', note: 'Le escribí al proveedor' },
    });
  });

  it('administration-E49: una revisada se busca con el filtro y se vuelve a abrir', async () => {
    await open(unreadable());
    const [one] = (await list()).body.anomalies;
    await kit.admin.request(`/api/anomalies/${one.id}/review`, {});
    const reviewed = (await list('?status=reviewed')).body.anomalies;
    expect(reviewed.map((each: { id: string }) => each.id)).toEqual([one.id]);
    expect(reviewed[0].note).toBeUndefined();
    const reopened = await kit.admin.request(`/api/anomalies/${one.id}/reopen`, {});
    expect(reopened.body).toMatchObject({ status: 'open' });
    expect(reopened.body.reviewedBy).toBeUndefined();
    expect(openCount(reopened.header)).toBe('1');
    expect(kit.audited('anomalies.reopened').at(-1)?.targets).toEqual([
      { kind: 'anomaly', id: one.id },
    ]);
  });

  it('administration-E50: la cierra su capítulo, sola: deja las abiertas y se ve como cerrada', async () => {
    const on = subject();
    await open(unreadable(on));
    await open({ kind: 'price-list-skipped-rows', subject: on, summary: { skipped: 3 } });
    await close(on, 'price-list-unreadable');
    expect((await list()).body.anomalies.map((one: { kind: string }) => one.kind)).toEqual([
      'price-list-skipped-rows',
    ]);
    await close(on);
    const seen = await list();
    expect(seen.body.anomalies).toEqual([]);
    expect(openCount(seen.header)).toBeUndefined();
    const closed = (await list('?status=closed')).body.anomalies;
    expect(closed).toHaveLength(2);
    expect(closed[0].closedAt).toEqual(expect.any(String));
  });

  it('la misma cosa encontrada otra vez pone al día la que había y la vuelve a abrir', async () => {
    const on = subject();
    await open(unreadable(on));
    const [one] = (await list()).body.anomalies;
    await kit.admin.request(`/api/anomalies/${one.id}/review`, { note: 'Visto' });
    await open({ ...unreadable(on), summary: { file: 'otra.xlsx' } });
    const again = (await list()).body.anomalies;
    expect(again).toHaveLength(1);
    expect(again[0]).toMatchObject({ id: one.id, status: 'open', summary: { file: 'otra.xlsx' } });
    expect(again[0].note).toBeUndefined();
    // Una cerrada no se toca: lo encontrado después es otra.
    await close(on);
    await open(unreadable(on));
    expect((await list()).body.anomalies[0].id).not.toBe(one.id);
  });

  it('marcar una que ya no está abierta contesta cómo está ahora; una que no existe, 404', async () => {
    const on = subject();
    await open(unreadable(on));
    const [one] = (await list()).body.anomalies;
    await close(on);
    const late = await kit.admin.request(`/api/anomalies/${one.id}/review`, {});
    expect(late.status).toBe(409);
    expect(late.body).toMatchObject({ error: 'anomaly-changed', anomaly: { status: 'closed' } });
    expect((await kit.admin.request(`/api/anomalies/${one.id}/reopen`, {})).status).toBe(409);
    const missing = '0190a000-0000-7000-8000-000000000000';
    expect((await kit.admin.request(`/api/anomalies/${missing}/review`, {})).status).toBe(404);
    expect((await kit.admin.request('/api/anomalies/nada/review', {})).status).toBe(404);
  });

  it('el revisor se ve con su nombre en la que otro cambió antes', async () => {
    await open(unreadable());
    const [one] = (await list()).body.anomalies;
    await kit.admin.request(`/api/anomalies/${one.id}/review`, {});
    const late = await kit.admin.request(`/api/anomalies/${one.id}/review`, {});
    expect(late.body.anomaly.reviewedBy).toEqual({
      id: kit.adminId,
      name: expect.any(String),
    });
  });

  it('una nota de más de 500 letras o un pedido raro no se aceptan', async () => {
    await open(unreadable());
    const [one] = (await list()).body.anomalies;
    const long = await kit.admin.request(`/api/anomalies/${one.id}/review`, {
      note: 'x'.repeat(501),
    });
    expect(long.status).toBe(400);
    expect((await kit.admin.request(`/api/anomalies/${one.id}/review`, { other: 1 })).status).toBe(
      400,
    );
    for (const query of ['?status=abierta', '?kind=otra', '?after=1', '?page=2'])
      expect((await list(query)).status).toBe(400);
  });

  it('de a 30, de la más nueva a la más vieja, por tipo', async () => {
    for (let i = 0; i < 31; i++) await open(unreadable());
    await open({ kind: 'price-list-skipped-rows', subject: subject(), summary: {} });
    const first = (await list('?kind=price-list-unreadable')).body;
    expect(first.anomalies).toHaveLength(30);
    expect(first.next).toBe(first.anomalies[29].id);
    const ids = first.anomalies.map((one: { id: string }) => one.id);
    expect([...ids].sort().reverse()).toEqual(ids);
    const rest = (await list(`?kind=price-list-unreadable&after=${first.next}`)).body;
    expect(rest.anomalies).toHaveLength(1);
    expect(rest.next).toBeUndefined();
    expect((await list('?kind=price-list-skipped-rows')).body.anomalies).toHaveLength(1);
  });
});

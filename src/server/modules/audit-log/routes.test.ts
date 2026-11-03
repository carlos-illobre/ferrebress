import { beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, minutes, type RolesKit } from '../../testing/users/roles-kit.ts';

describe('Quién hizo qué, desde el servidor', () => {
  let kit: RolesKit;
  let viewer: Awaited<ReturnType<RolesKit['person']>>;
  let other: Awaited<ReturnType<RolesKit['person']>>;

  beforeAll(async () => {
    kit = await createRolesKit();
    const view = await kit.role('Mira el registro', ['audit-log.view']);
    viewer = await kit.person([view]);
    other = await kit.person([await kit.role('Solo personas', ['users.view'])]);
    // Más de 20 acciones, para las páginas.
    for (let i = 0; i < 6; i++) await kit.role(`Rol ${i}`, ['users.view']);
  });

  const list = (query = '', by = kit.admin) => by.request(`/api/audit-log${query}`);

  it('audit-log-E11, E15: el Administrador tiene «Ver quién hizo qué» y ve las acciones de todos', async () => {
    const roles = (await kit.admin.request('/api/roles')).body.roles;
    expect(roles[0].permissions).toContain('audit-log.view');
    const page = await list();
    expect(page.status).toBe(200);
    expect(page.body).toMatchObject({ today: '2026-10-31', page: 1 });
    expect(page.body.events.length).toBeGreaterThan(0);
  });

  it('audit-log-E12, E14: sin el permiso, 403 sin datos, y queda anotado', async () => {
    for (const path of ['', '/people', '/day']) {
      const denied = await other.device.request(`/api/audit-log${path}`);
      expect(denied).toMatchObject({
        status: 403,
        body: { error: 'forbidden', permission: 'audit-log.view' },
      });
    }
    expect(kit.audited('permission.denied').at(-1)).toMatchObject({
      actor: { kind: 'person', userId: other.id },
      data: { permission: 'audit-log.view' },
    });
  });

  it('audit-log-E05, E05b: mirar no se anota, salvo abrir Quién hizo qué una vez por sesión y por día', async () => {
    const opened = () =>
      kit
        .audited('audit-log.opened')
        .filter((one) => one.actor.kind === 'person' && one.actor.userId === viewer.id);
    await viewer.device.request('/api/users');
    expect(opened()).toHaveLength(0);
    await list('', viewer.device);
    await list('?page=1', viewer.device);
    await viewer.device.request('/api/audit-log/people');
    expect(opened()).toHaveLength(1);
    kit.later(minutes(24 * 60));
    await kit.reconfirm();
    await viewer.device.signInWithGoogle({ sub: 'sub-1', email: viewer.email });
    await list('', viewer.device);
    expect(opened()).toHaveLength(2);
  });

  it('audit-log-E17, E18, E19: de a 20 o de a 10, con el total y las páginas', async () => {
    const twenty = (await list()).body;
    const ten = (await list('?size=10')).body;
    expect(twenty.events).toHaveLength(20);
    expect(ten.events).toHaveLength(10);
    expect(ten.total).toBe(twenty.total);
    expect(ten.pages).toBe(Math.ceil(ten.total / 10));
    const second = (await list('?size=10&page=2')).body;
    expect(second.events[0].id).toBe(twenty.events[10].id);
    // De la más nueva a la más vieja.
    const times = twenty.events.map((one: { at: string }) => one.at);
    expect(times).toEqual([...times].sort().reverse());
  });

  it('audit-log-E39: un parámetro mal, uno desconocido o una página de más dan 400 con cuál', async () => {
    const pages = (await list('?size=10')).body.pages;
    for (const [query, field] of [
      ['?nada=1', 'nada'],
      ['?size=15', 'size'],
      ['?page=0', 'page'],
      [`?size=10&page=${pages + 1}`, 'page'],
      ['?from=2026-02-30', 'from'],
      ['?from=2026-11-05', 'from'],
      ['?until=2026-11-30', 'until'],
      ['?from=2019-12-31', 'from'],
      ['?range=today&from=2026-10-01', 'range'],
      ['?tone=red&group=users', 'tone'],
      ['?group=ventas', 'group'],
      ['?type=nada.de.nada', 'type'],
      ['?group=roles&type=user.renamed', 'type'],
      ['?by=alguien', 'by'],
    ])
      expect(await list(query)).toMatchObject({
        status: 400,
        body: { error: 'bad-request', field },
      });
    expect((await kit.admin.request('/api/audit-log/day?date=2026-11-05')).body).toEqual({
      error: 'bad-request',
      field: 'date',
    });
    expect((await kit.admin.request('/api/audit-log/day?nada=1')).status).toBe(400);
  });

  it('audit-log-E37: no hay forma de cambiar ni borrar una acción', async () => {
    const id = (await list()).body.events[0].id;
    expect((await kit.admin.request('/api/audit-log', {})).status).toBe(404);
    expect((await kit.admin.request(`/api/audit-log/${id}`, {})).status).toBe(404);
  });

  it('audit-log-E23, E24, E27, E28: por quién, a quién, tipo y color, combinados', async () => {
    const target = await kit.person([await kit.role('Para filtrar', ['users.view'])], {
      name: 'Filtrada',
    });
    const { version } = await kit.row(target.id);
    await kit.admin.request(`/api/users/${target.id}`, { version, name: 'Filtrada Gómez' });
    const byAdmin = (await list(`?by=${kit.adminId}`)).body.events;
    expect(byAdmin.every((one: { actor: { id: string } }) => one.actor.id === kit.adminId)).toBe(
      true,
    );
    const toTarget = (await list(`?to=${target.id}`)).body.events;
    expect(toTarget.map((one: { type: string }) => one.type).sort()).toEqual([
      'user.authorized',
      'user.renamed',
    ]);
    // audit-log-E07: el nombre de ese momento, con el de hoy al lado.
    expect(
      toTarget.find((one: { type: string }) => one.type === 'user.authorized').targets,
    ).toEqual([{ kind: 'person', id: target.id, name: 'Filtrada', today: 'Filtrada Gómez' }]);
    const renamed = (await list(`?by=${kit.adminId}&type=user.renamed&to=${target.id}`)).body;
    expect(renamed.total).toBe(1);
    expect(renamed.events[0].changes).toEqual({
      name: { before: 'Filtrada', after: 'Filtrada Gómez' },
    });
    const roles = (await list('?group=roles')).body.events;
    expect(roles.every((one: { type: string }) => one.type.match(/^(role|user\.roles)/))).toBe(
      true,
    );
    const refused = (await list('?tone=amber')).body.events;
    expect(refused.length).toBeGreaterThan(0);
    expect(refused.every((one: { tone: string }) => one.tone === 'amber')).toBe(true);
  });

  it('audit-log-E08: lo que hizo el sistema, y alguien sin entrar', async () => {
    const system = (await list('?by=system')).body.events;
    expect(system.map((one: { type: string }) => one.type)).toContain('role.permissions-added');
    expect(system[0].actor).toEqual({ kind: 'system' });
    expect((await list('?by=outsider')).body.total).toBe(0);
  });

  it('audit-log-E25, E26: los atajos con el día del servidor, y desde y hasta', async () => {
    const today = (await list('?range=today')).body;
    expect(today.events.every((one: { at: string }) => one.at >= '2026-11-01T03:00:00.000Z')).toBe(
      true,
    );
    const yesterday = (await list('?range=yesterday')).body;
    expect(yesterday.total + today.total).toBe((await list('?range=week')).body.total);
    expect((await list('?from=2026-10-31&until=2026-10-31')).body.total).toBe(yesterday.total);
    expect((await list('?range=month')).body.total).toBe(today.total);
    expect((await list('?from=2026-10-01')).body.total).toBe((await list()).body.total);
    expect((await list('?until=2026-10-30')).body.total).toBe(0);
  });

  it('audit-log-R4.9: el resumen del período, la tira de un día y la página de una raya', async () => {
    const page = (await list('?range=yesterday&summary=1&strip=1')).body;
    expect(page.summary.total).toBe(page.total);
    expect(page.summary.amber + page.summary.red).toBeLessThanOrEqual(page.total);
    expect(page.strip).toHaveLength(page.total);
    expect(page.strip[0].at).toBeLessThanOrEqual(page.strip.at(-1).at);
    expect(page.days).toEqual({ '2026-10-31': page.total });
    // Sin fechas, el resumen es de hoy; con un período de varios días, sin tira.
    const open = (await list('?summary=1&strip=1')).body;
    expect(open.summary.total).toBe((await list('?range=today')).body.total);
    expect((await list('?range=week&strip=1')).body.strip).toBeUndefined();
    const oldest = page.strip[0].id;
    const around = (await list(`?range=yesterday&size=10&around=${oldest}`)).body;
    expect(around).toMatchObject({ selected: oldest, page: around.pages });
    const missing = (await list('?size=10&around=2026:999999')).body;
    expect(missing.selected).toBeUndefined();
    expect(missing.page).toBe(1);
  });

  it('audit-log-E30: las personas, también las borradas, sin su correo', async () => {
    const gone = await kit.person([await kit.role('Se va', ['users.view'])], {
      signIn: false,
      name: 'Camila',
    });
    const { version } = await kit.row(gone.id);
    await kit.admin.request(`/api/users/${gone.id}/delete`, { version });
    const people = (await kit.admin.request('/api/audit-log/people')).body.people;
    expect(people.find((one: { id: string }) => one.id === gone.id)).toEqual({
      id: gone.id,
      name: 'Camila',
      state: 'deleted',
    });
    expect(people.find((one: { id: string }) => one.id === kit.adminId)).toMatchObject({
      email: 'admin@example.com',
      state: 'active',
    });
  });

  it('audit-log-E40, E47: el día de la cinta, entero, de lo más viejo a lo más nuevo, con su semana', async () => {
    const day = (await kit.admin.request('/api/audit-log/day?date=2026-10-31')).body;
    expect(day.date).toBe('2026-10-31');
    expect(day.week.map((one: { date: string }) => one.date)).toEqual([
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
    expect(day.week.at(-1).total).toBe(day.events.length);
    const times = day.events.map((one: { at: string }) => one.at);
    expect(times).toEqual([...times].sort());
    expect((await kit.admin.request('/api/audit-log/day')).body.date).toBe('2026-11-01');
  });

  it('audit-log-E48: un día con más de 2.000 acciones no abre la cinta; la tira va por minuto', async () => {
    const { audit } = kit.server.platform;
    const start = Date.parse('2026-10-29T12:00:00Z');
    for (let i = 0; i < 2_001; i++)
      audit.record({
        type: 'sign-out',
        at: new Date(start + i * 1_000),
        actor: { kind: 'system' },
      });
    const day = (await kit.admin.request('/api/audit-log/day?date=2026-10-29')).body;
    expect(day).toMatchObject({ tooMany: 2_001 });
    expect(day.events).toBeUndefined();
    const strip = (await list('?from=2026-10-29&until=2026-10-29&strip=1')).body.strip;
    expect(strip).toHaveLength(34);
  });

  it('seguridad: no sale lo que el tipo no muestra, ni identificadores de dispositivos', async () => {
    const stranger = await kit.admin.request('/api/audit-log?type=sign-in.succeeded');
    const body = JSON.stringify(stranger.body);
    expect(body).not.toContain('deviceId');
    expect(stranger.body.events[0].data).toEqual({ method: 'google' });
  });

  it('seguridad: como mucho 60 pedidos por minuto por persona', async () => {
    let last = 0;
    for (let i = 0; i < 61; i++) last = (await list('', viewer.device)).status;
    expect(last).toBe(429);
    expect(kit.audited('request.throttled').at(-1)?.data).toEqual({
      topic: 'audit-log',
      by: 'person',
    });
  });
});

// Lo que la lista suma para «Actualizar solo» (05 · R4.6, E51, E53; diseño de 05, §§ 5 y 7.1): desde
// dónde contar las nuevas, si el período incluye hoy, cuántas nuevas con los filtros, y lo que la
// pantalla pide sola (X-Auto): no anota que se abrió y tiene su propio límite.
import { beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, type RolesKit } from '../../testing/users/roles-kit.ts';
import { auditLogSettings } from './settings.ts';

const auto = { 'X-Auto': '1' };

describe('las nuevas de Quién hizo qué', () => {
  let kit: RolesKit;
  let viewer: Awaited<ReturnType<RolesKit['person']>>;

  beforeAll(async () => {
    kit = await createRolesKit();
    viewer = await kit.person([await kit.role('Mira el registro', ['audit-log.view'])]);
  });

  const get = (path: string, extra?: Record<string, string>) =>
    viewer.device.request(`/api/audit-log${path}`, undefined, extra);

  it('la lista dice desde dónde contar y si el período incluye hoy (E53)', async () => {
    const page = (await get('')).body;
    expect(page.latest).toMatch(/^2025:0\.2026:\d+$/);
    expect(page.withToday).toBe(true);
    expect((await get('?range=week')).body.withToday).toBe(true);
    expect((await get('?range=yesterday')).body.withToday).toBe(false);
    expect((await get('?from=2026-10-01&until=2026-10-30')).body.withToday).toBe(false);
    expect((await get('?from=2026-10-01')).body.withToday).toBe(true);
  });

  it('E51: cuántas llegaron desde ahí, con los filtros de la lista', async () => {
    const { latest } = (await get('')).body;
    expect((await get(`/new?since=${latest}`)).body).toEqual({ count: 0 });
    await kit.role('Uno', ['users.view']);
    await kit.role('Dos', ['users.view']);
    expect((await get(`/new?since=${latest}`)).body).toEqual({ count: 2 });
    expect((await get(`/new?since=${latest}&group=roles`)).body.count).toBe(2);
    expect((await get(`/new?since=${latest}&by=${viewer.id}`)).body).toEqual({ count: 0 });
    expect((await get(`/new?since=${latest}&range=yesterday`)).body).toEqual({ count: 0 });
  });

  it('un since que no es de los dos años vivos, o un número inseguro, es un pedido mal hecho', async () => {
    const wrong = [
      '2024:1.2026:1',
      '2026:1.2027:1',
      `2025:0.2026:${2 ** 53}`,
      'nada',
      '2026:1.2025:x',
    ];
    for (const since of [...wrong, '2026:1', '2026:1.2026:1', '2026:1.2025:0']) {
      const answer = await get(`/new?since=${since}`);
      expect(answer).toMatchObject({ status: 400, body: { field: 'since' } });
    }
    expect((await get('/new?since=2025:0.2026:1&page=1')).status).toBe(400);
    expect((await get('/new?since=2025:0.2026:1&from=2030-01-01')).body).toMatchObject({
      field: 'from',
    });
    expect((await get('/new?since=2025:0.2026:1&tone=red&group=roles')).body).toMatchObject({
      field: 'tone',
    });
    expect((await get('/new')).status).toBe(400);
  });

  it('lo que la pantalla pide sola no anota que se abrió y tiene su propio límite', async () => {
    const lucia = await kit.person([await kit.role('Otra que mira', ['audit-log.view'])]);
    const opened = () =>
      kit
        .audited('audit-log.opened')
        .filter((one) => one.actor.kind === 'person' && one.actor.userId === lucia.id);
    // La abre a mano: queda anotado; lo que pide sola después, no.
    await lucia.device.request('/api/audit-log');
    expect(opened()).toHaveLength(1);
    for (let i = 0; i < auditLogSettings.autoReads.max; i++)
      await lucia.device.request('/api/audit-log', undefined, auto);
    expect((await lucia.device.request('/api/audit-log', undefined, auto)).status).toBe(429);
    // Lo que se pide al tocar sigue: el límite de lo que se pide solo es aparte.
    expect((await lucia.device.request('/api/audit-log')).status).toBe(200);
    expect(opened()).toHaveLength(1);
  });

  it('seguridad, 24 y 26: la cabecera no borra el rastro de una sesión que nunca abrió a mano, ni vale en las otras rutas', async () => {
    const pedro = await kit.person([await kit.role('Otro que mira', ['audit-log.view'])]);
    const opened = () =>
      kit
        .audited('audit-log.opened')
        .filter((one) => one.actor.kind === 'person' && one.actor.userId === pedro.id);
    await pedro.device.request('/api/audit-log/people', undefined, auto);
    expect(opened()).toHaveLength(1);
    // En /day la cabecera no usa el límite de lo que se pide solo: cuenta en el de la persona.
    for (let i = 0; i < auditLogSettings.autoReads.max; i++)
      await pedro.device.request('/api/audit-log/day', undefined, auto);
    expect((await pedro.device.request('/api/audit-log/day', undefined, auto)).status).toBe(200);
  });

  it('seguridad, 29: sin el permiso, la cabecera no cambia nada: 403', async () => {
    const nobody = await kit.person([await kit.role('Sin registro', ['users.view'])]);
    const answer = await nobody.device.request(
      '/api/audit-log/new?since=2025:0.2026:1',
      undefined,
      auto,
    );
    expect(answer).toMatchObject({ status: 403, body: { error: 'forbidden' } });
  });

  it('la memoria de quién abrió a mano tiene un tope: pasado, empieza de cero', async () => {
    const saved = auditLogSettings.openedMemory;
    auditLogSettings.openedMemory = 1;
    const ana = await kit.person([await kit.role('Mira tres', ['audit-log.view'])]);
    await ana.device.request('/api/audit-log');
    await viewer.device.request('/api/audit-log');
    // Ana ya no está en la memoria: lo que pide sola vuelve a contar como abrir, y no se anota de
    // nuevo hoy (ya lo anotó).
    const before = kit.audited('audit-log.opened').length;
    await ana.device.request('/api/audit-log', undefined, auto);
    expect(kit.audited('audit-log.opened')).toHaveLength(before);
    auditLogSettings.openedMemory = saved;
  });
});

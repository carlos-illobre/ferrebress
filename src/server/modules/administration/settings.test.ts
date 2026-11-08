// Los ajustes para todos desde la aplicación (06 · R1, R2, R4, R6, R7; diseño de 06, § 3): verlos con
// cualquier sesión, cambiarlos con «Cambiar los ajustes», el choque con otro y Quién hizo qué.
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, type RolesKit } from '../../testing/users/roles-kit.ts';

describe('los ajustes para todos', () => {
  let kit: RolesKit;
  let seller: Awaited<ReturnType<RolesKit['person']>>;

  beforeAll(async () => {
    kit = await createRolesKit();
    const sells = await kit.role('Mostrador', ['users.view']);
    seller = await kit.person([sells]);
  });
  afterAll(() => kit.server.close());

  const read = async (device = kit.admin) => (await device.request('/api/administration')).body;
  const save = (key: string, body: object, device = kit.admin) =>
    device.request(`/api/administration/settings/${key}`, body);

  it('administration-E01: cualquiera con sesión ve los ajustes con su valor y la zona', async () => {
    expect(await read(seller.device)).toEqual({
      settings: {
        roundingStep: { value: 1000, version: 0 },
        quickMargins: { value: [300, 200, 100, 50, 25], version: 0 },
        sessionIdle: { value: 60, version: 0 },
        sessionMax: { value: 8, version: 0 },
        pairingDays: { value: 30, version: 0 },
      },
      businessTimeZone: 'America/Argentina/Buenos_Aires',
    });
  });

  it('sin sesión no se ven', async () => {
    const { createDevice } = await import('../../testing/sign-in/sign-in-server.ts');
    expect((await createDevice(kit.server).request('/api/administration')).status).toBe(401);
  });

  it('administration-E04: el rol Administrador tiene «Cambiar los ajustes»', async () => {
    expect(await kit.server.users.permissionsOf(kit.adminId)).toContain('settings.change');
    expect(await kit.server.users.permissionsOf(seller.id)).not.toContain('settings.change');
  });

  it('administration-E03: sin el permiso, el servidor rechaza, nada cambia y queda el intento', async () => {
    const refused = await save('pairingDays', { value: 15, version: 0 }, seller.device);
    expect(refused).toMatchObject({
      status: 403,
      body: { error: 'forbidden', permission: 'settings.change' },
    });
    expect((await read()).settings.pairingDays).toEqual({ value: 30, version: 0 });
    expect(kit.audited('permission.denied').at(-1)).toMatchObject({
      actor: { userId: seller.id },
      data: { permission: 'settings.change' },
    });
  });

  it('administration-E09: se guarda, vale en el momento y queda con el antes y el después', async () => {
    const saved = await save('quickMargins', { value: [300, 200, 150, 50, 25], version: 0 });
    expect(saved).toMatchObject({
      status: 200,
      body: { value: [300, 200, 150, 50, 25], version: 1 },
    });
    expect(kit.server.administration.settings().quickMargins).toEqual([300, 200, 150, 50, 25]);
    expect(kit.audited('settings.changed').at(-1)).toMatchObject({
      actor: { userId: kit.adminId },
      changes: { value: { before: [300, 200, 100, 50, 25], after: [300, 200, 150, 50, 25] } },
      data: { key: 'quickMargins' },
    });
  });

  it('administration-E10: deshacer es otro cambio, con la versión que devolvió el anterior', async () => {
    const undone = await save('quickMargins', { value: [300, 200, 100, 50, 25], version: 1 });
    expect(undone.body).toEqual({ value: [300, 200, 100, 50, 25], version: 2 });
    expect(kit.audited('settings.changed').at(-1)).toMatchObject({
      changes: { value: { before: [300, 200, 150, 50, 25], after: [300, 200, 100, 50, 25] } },
    });
  });

  it('administration-E26: los márgenes se guardan ordenados de mayor a menor', async () => {
    const saved = await save('quickMargins', { value: [300, 200, 100, 50, 400], version: 2 });
    expect(saved.body.value).toEqual([400, 300, 200, 100, 50]);
  });

  it('administration-E27, E28, E37, E38: un valor que no vale no se guarda y dice cuál', async () => {
    for (const [key, value] of [
      ['quickMargins', [400, 300, 200, 100, 400]],
      ['quickMargins', [400, 300, 200, 100, 0]],
      ['sessionIdle', 45],
      ['pairingDays', 366],
      ['pairingDays', 1.5],
    ] as const) {
      const refused = await save(key, { value, version: 3 });
      expect(refused).toMatchObject({ status: 400, body: { error: 'invalid-setting', key } });
    }
    expect((await read()).settings.quickMargins.version).toBe(3);
  });

  it('un cuerpo que no es el del contrato o una clave que no existe no llegan a la regla', async () => {
    expect((await save('pairingDays', { value: 15 })).status).toBe(400);
    expect((await save('pairingDays', { value: 15, version: 0, other: 1 })).status).toBe(400);
    for (const key of ['__proto__', 'constructor', 'zona'])
      expect((await save(key, { value: 15, version: 0 })).status).toBe(404);
  });

  it('el mismo valor que ya tiene no cambia nada ni queda en Quién hizo qué', async () => {
    const before = kit.audited('settings.changed').length;
    const same = await save('sessionMax', { value: 8, version: 0 });
    expect(same).toMatchObject({ status: 200, body: { value: 8, version: 0 } });
    expect(kit.audited('settings.changed')).toHaveLength(before);
  });

  it('administration-E12: desde lo de arranque, el segundo que cambia lo mismo ve lo del primero', async () => {
    const [first, second] = await Promise.all([
      save('pairingDays', { value: 15, version: 0 }),
      save('pairingDays', { value: 60, version: 0 }),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
    const lost = first.status === 409 ? first : second;
    const won = first.status === 200 ? first : second;
    expect(lost.body).toEqual({
      error: 'setting-changed',
      value: won.body.value,
      version: 1,
      by: 'Ana Gómez',
    });
    // Con una versión vieja, también.
    expect(await save('pairingDays', { value: 90, version: 0 })).toMatchObject({
      status: 409,
      body: { error: 'setting-changed', version: 1 },
    });
  });

  it('una versión que no es la de arranque, en un ajuste que nadie cambió, también choca', async () => {
    expect(await save('roundingStep', { value: 500, version: 7 })).toMatchObject({
      status: 409,
      body: { error: 'setting-changed', value: 1000, version: 0, by: '' },
    });
  });

  it('administration-E13: dos ajustes distintos a la vez se guardan los dos', async () => {
    const [idle, max] = await Promise.all([
      save('sessionIdle', { value: 120, version: 0 }),
      save('sessionMax', { value: 12, version: 0 }),
    ]);
    expect([idle.status, max.status]).toEqual([200, 200]);
    expect(kit.server.administration.settings()).toMatchObject({
      sessionIdle: 120,
      sessionMax: 12,
    });
  });

  it('el límite de cambios por sesión', async () => {
    let last = 0;
    for (let i = 0; i < 31; i++)
      last = (await save('sessionMax', { value: 12, version: 1 })).status;
    expect(last).toBe(429);
  });

  it('las consultas: ver, ninguna; guardar, las de la transacción', async () => {
    expect(await kit.server.countQueries(() => read())).toBe(0);
    const other = await kit.person([await kit.systemRole()]);
    expect(
      await kit.server.countQueries(() =>
        save('pairingDays', { value: 20, version: 1 }, other.device),
      ),
    ).toBeLessThanOrEqual(6);
  });
});

describe('lo guardado se valida al arrancar', () => {
  it('un valor que no vale frena el arranque', async () => {
    const { createSignInServer } = await import('../../testing/sign-in/sign-in-server.ts');
    const { createModules } = await import('../../modules.ts');
    const first = await createSignInServer();
    await sql`insert into administration.settings values ('sessionIdle', '"mucho"', 1, gen_random_uuid())`.execute(
      first.platform.db,
    );
    const { modules } = createModules();
    const admin = modules.find((one) => one.name === 'administration');
    await expect(admin?.register({ ...first.platform } as never)).rejects.toThrow(
      'El ajuste sessionIdle guardado no es válido',
    );
    await first.close();
    // Una clave que ya no existe se ignora; lo que vale se carga con su versión. Quien lo cambió ya
    // no está: el choque se dice sin nombre.
    const again = await createSignInServer();
    await sql`insert into administration.settings values
      ('vieja', '1', 1, gen_random_uuid()), ('pairingDays', '15', 4, gen_random_uuid())`.execute(
      again.platform.db,
    );
    const fresh = createModules();
    await fresh.modules[0]?.register({ ...again.platform } as never);
    expect(fresh.administration.settings().pairingDays).toBe(15);
    expect(again.administration.settings().pairingDays).toBe(30);
    await again.close();
  });

  it('antes de cargarse, nadie lee los ajustes', async () => {
    const { createModules } = await import('../../modules.ts');
    expect(() => createModules().administration.settings()).toThrow('todavía no se cargaron');
  });
});

describe('quien lo cambió ya no está', () => {
  it('el choque se dice sin nombre', async () => {
    const kit = await createRolesKit();
    await sql`insert into administration.settings values ('pairingDays', '15', 1, gen_random_uuid())`.execute(
      kit.server.platform.db,
    );
    expect(
      await kit.admin.request('/api/administration/settings/pairingDays', {
        value: 20,
        version: 0,
      }),
    ).toMatchObject({ status: 409, body: { error: 'setting-changed', by: '' } });
    await kit.server.close();
  });
});

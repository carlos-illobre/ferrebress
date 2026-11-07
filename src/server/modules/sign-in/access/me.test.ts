// Lo mío (04 · R6 a R8; diseño de 04b, § 3 y § 10): una persona sin ningún permiso ve y corta lo suyo,
// por dispositivo, con la misma lógica que Usuarios, y nunca lo de otra persona.
import { beforeAll, describe, expect, it } from 'vitest';
import { createMeKit, type MeKit } from '../../../testing/sign-in/me-kit.ts';
import { androidPhone } from '../../../testing/sign-in/offline-kit.ts';
import { createDevice } from '../../../testing/sign-in/sign-in-server.ts';

describe('lo mío, desde Configuración', () => {
  let me: MeKit;
  const computer = () => me.computer();
  const nextTo: MeKit['nextTo'] = (linked) => me.nextTo(linked);
  const person = () => me.person();
  const enterWithCode: MeKit['enterWithCode'] = (linked, pc) => me.enterWithCode(linked, pc);
  const mine: MeKit['mine'] = (device) => me.mine(device);
  const audit = () => me.audit();

  beforeAll(async () => {
    me = await createMeKit();
  });

  it('device-settings-E10, E40, E45, E47: sin permisos ve lo suyo por dispositivo, sin la sesión de este', async () => {
    const linked = await person();
    const [office, home] = [computer(), nextTo(linked)];
    // Entrar dos veces en la misma deja la sesión vieja abierta: tampoco figura (R7.1).
    await office.signInWithGoogle(linked.claims);
    await office.signInWithGoogle(linked.claims);
    await enterWithCode(linked, home);
    const fromOffice = await mine(office);
    expect(fromOffice.here).toEqual({
      deviceLabel: 'Chrome en Windows',
      isPhone: false,
      passkey: 'none',
      computers: [],
    });
    // El celular, con su sesión, su huella y la computadora que hizo entrar con su código.
    expect(fromOffice.others).toEqual([
      {
        key: expect.any(String),
        deviceLabel: 'Chrome en Android',
        isPhone: true,
        session: expect.objectContaining({ way: 'google', id: expect.any(String) }),
        passkey: { createdAt: expect.any(Number), lastUsedAt: expect.any(Number) },
        computers: [
          {
            deviceLabel: 'Chrome en Windows',
            session: expect.objectContaining({ way: 'qr' }),
          },
        ],
      },
    ]);
    // Desde el celular: su huella y la computadora que hizo entrar, en este; la otra, aparte.
    const fromPhone = await mine(linked.phone);
    expect(fromPhone.here).toMatchObject({
      isPhone: true,
      passkey: 'mine',
      since: expect.any(Object),
    });
    expect(fromPhone.here.computers).toHaveLength(1);
    expect(fromPhone.others).toEqual([
      expect.objectContaining({ isPhone: false, passkey: null, computers: [] }),
    ]);
  });

  it('device-settings-E43: vincular la huella pide haber pasado por Google hace poco (02 · R3.8)', async () => {
    const claims = await me.kit.newAccount();
    const phone = createDevice(me.kit.server, { userAgent: androidPhone, ip: '200.9.9.9' });
    await phone.signInWithGoogle(claims);
    me.kit.clock.now += 6 * 60_000;
    expect((await mine(phone)).here.passkey).toBe('none');
    expect((await phone.request('/api/passkeys/options', {})).status).toBe(403);
  });

  it('device-settings-E44: un celular con la huella de otra persona lo dice', async () => {
    const owner = await person();
    const other = await me.kit.newAccount();
    owner.phone.cookie = '';
    await owner.phone.signInWithGoogle(other);
    expect((await mine(owner.phone)).here.passkey).toBe('other');
  });

  it('device-settings-E48: «Cerrar» una y «Cerrar todas», nunca la de este; queda anotado', async () => {
    const linked = await person();
    const [a, b] = [computer(), computer()];
    await a.signInWithGoogle(linked.claims);
    await b.signInWithGoogle(linked.claims);
    await a.request('/api/me/device-name', { name: 'A' });
    me.kit.clock.now += 60_000;
    await b.request('/api/me/device-name', { name: 'B' });
    // La usada más recientemente primero (R7.1).
    const { others } = await mine(linked.phone);
    expect(others.map((d: { deviceName: string }) => d.deviceName)).toEqual(['B', 'A']);
    // Desde A: B y el celular, con su huella todavía sin usar.
    expect((await mine(a)).others).toHaveLength(2);
    const one = others[0].session.id;
    expect((await linked.phone.request(`/api/me/sessions/${one}/close`, {})).body).toEqual({
      closed: 1,
    });
    expect(audit().at(-1)).toMatchObject({ type: 'session.closed', data: { from: 'settings' } });
    expect((await linked.phone.request('/api/me/sessions/close', {})).body).toEqual({ closed: 1 });
    expect((await linked.phone.request('/api/start')).body.person).toBeDefined();
    expect((await mine(linked.phone)).others).toEqual([]);
  });

  it('device-settings-E49, E51: «Se me perdió» desde la computadora corta el celular y lo que hizo entrar', async () => {
    const linked = await person();
    const [office, home] = [computer(), nextTo(linked)];
    await office.signInWithGoogle(linked.claims);
    await enterWithCode(linked, home);
    const [phone] = (await mine(office)).others;
    // Una computadora no se corta como perdida.
    const [pc] = (await mine(linked.phone)).others.filter((d: { isPhone: boolean }) => !d.isPhone);
    expect((await office.request(`/api/me/devices/${pc.key}/cut`, { how: 'lost' })).status).toBe(
      404,
    );
    const cut = await office.request(`/api/me/devices/${phone.key}/cut`, { how: 'lost' });
    expect(cut.body).toEqual({ sessions: 2, passkey: true });
    expect(audit().at(-1)).toMatchObject({
      type: 'phone.cut',
      tone: 'red',
      targets: [{ kind: 'person', id: linked.userId }],
      data: { from: 'settings' },
    });
    expect((await linked.phone.request('/api/start')).body.person).toBeUndefined();
    expect((await home.request('/api/start')).body.person).toBeUndefined();
    expect((await office.request('/api/start')).body.person).toBeDefined();
  });

  it('device-settings-R1.8, 02 · R5.6: desde la computadora que entró con su código, se ve que «Se me perdió» la corta también', async () => {
    const linked = await person();
    const home = nextTo(linked);
    await me.enterWithCode(linked, home);
    const [phone] = (await mine(home)).others;
    expect(phone.computers).toEqual([expect.objectContaining({ here: true })]);
    expect((await mine(home)).here.computers).toEqual([]);
    await home.request(`/api/me/devices/${phone.key}/cut`, { how: 'lost' });
    expect((await home.request('/api/start')).body.person).toBeUndefined();
  });

  it('device-settings-E41: «Quitar» la huella de otro celular cierra su sesión y lo que hizo entrar', async () => {
    const linked = await person();
    const office = computer();
    await office.signInWithGoogle(linked.claims);
    const [phone] = (await mine(office)).others;
    const cut = await office.request(`/api/me/devices/${phone.key}/cut`, { how: 'remove' });
    expect(cut.body).toEqual({ sessions: 1, passkey: true });
    expect(audit().at(-1)).toMatchObject({ type: 'passkey.removed', data: { from: 'settings' } });
  });

  it('device-settings-E42, E50: la huella del celular en la mano se quita sin cerrar nada; no se corta como perdido', async () => {
    const linked = await person();
    await me.kit.onlyWith(linked.userId, ['offline.work']);
    expect((await linked.phone.request('/api/start')).body.person.offline).toBe(true);
    const home = nextTo(linked);
    await enterWithCode(linked, home);
    const removed = await linked.phone.request('/api/me/passkey/remove', {});
    expect(removed.body).toEqual({ sessions: 0, passkey: true });
    const start = (await linked.phone.request('/api/start')).body;
    expect(start.person.offline).toBeUndefined();
    expect((await home.request('/api/start')).body.person).toBeDefined();
    expect((await mine(linked.phone)).here.passkey).toBe('none');
    // Otra vez no hay nada que quitar, y no se anota.
    const before = audit().length;
    expect((await linked.phone.request('/api/me/passkey/remove', {})).body.passkey).toBe(false);
    expect(audit()).toHaveLength(before);
    // Su propia sesión, como celular perdido, no: se sale con «Salir».
    const again = await me.kit.linkedPhone();
    const office = computer();
    await office.signInWithGoogle(again.claims);
    const [own] = (await mine(office)).others;
    const self = await again.phone.request(`/api/me/devices/${own.key}/cut`, { how: 'lost' });
    expect(self.body.error).toBe('self');
  });

  it('una sesión o un celular de otra persona da 404, como uno que no existe; y queda anotado una vez', async () => {
    const [ana, beto] = [await person(), await person()];
    const pc = computer();
    await pc.signInWithGoogle(beto.claims);
    const [betoPhone] = (await mine(pc)).others;
    const close = await ana.phone.request(`/api/me/sessions/${betoPhone.session.id}/close`, {});
    expect(close.status).toBe(404);
    const cut = await ana.phone.request(`/api/me/devices/${betoPhone.key}/cut`, { how: 'lost' });
    expect(cut.status).toBe(404);
    expect((await ana.phone.request('/api/me/devices/x/cut', { how: 'lost' })).status).toBe(404);
    expect((await ana.phone.request('/api/me/devices/x/cut', { how: 'otro' })).status).toBe(404);
    expect(
      audit().filter(
        (e) =>
          e.type === 'users.rejected' && e.actor.kind === 'person' && e.actor.userId === ana.userId,
      ),
    ).toHaveLength(1);
    expect((await createDevice(me.kit.server).request('/api/me/devices')).status).toBe(401);
  });

  it('device-settings-E52, R9.4: el nombre de cada dispositivo, en lo mío, en Usuarios y en «Se perdió»', async () => {
    const linked = await me.kit.linkedPhone();
    const [office, home] = [computer(), nextTo(linked)];
    await office.signInWithGoogle(linked.claims);
    await enterWithCode(linked, home);
    for (const [device, name] of [
      [linked.phone, 'Celu de Ana'],
      [office, 'Oficina'],
      [home, 'Casa'],
    ] as const)
      await device.request('/api/me/device-name', { name });
    const fromOffice = await mine(office);
    expect(fromOffice.here.deviceName).toBe('Oficina');
    expect(fromOffice.others[0]).toMatchObject({
      deviceName: 'Celu de Ana',
      computers: [{ deviceName: 'Casa' }],
    });
    const card = (await office.request(`/api/users/${linked.userId}/access`)).body;
    expect(card.phones).toEqual([expect.objectContaining({ deviceName: 'Celu de Ana' })]);
    expect(card.sessions.map((s: { deviceName: string }) => s.deviceName).sort()).toEqual([
      'Casa',
      'Celu de Ana',
    ]);
    const lost = (await office.request('/api/lost-phones')).body.people;
    const own = lost.find((p: { userId: string }) => p.userId === linked.userId);
    expect(own.phones).toEqual([expect.objectContaining({ deviceName: 'Celu de Ana' })]);
    // Sin la sesión del celular, sigue con su huella.
    await linked.phone.request('/api/sign-out', {});
    expect((await mine(office)).others[0]).toMatchObject({
      session: null,
      deviceName: 'Celu de Ana',
    });
  });
});

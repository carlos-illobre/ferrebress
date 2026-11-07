// El nombre de cada dispositivo (04 · R9; diseño de 04b, § 3 y § 10): ponerlo, cambiarlo y borrarlo
// desde el dispositivo de la sesión, verlo en /api/start y en Quién hizo qué, y que se borre solo.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testConfig } from '../../../testing/config.ts';
import { createAuthenticator } from '../../../testing/sign-in/authenticator.ts';
import { androidPhone } from '../../../testing/sign-in/offline-kit.ts';
import { openScreen } from '../../../testing/sign-in/screen-channel.ts';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in/sign-in-server.ts';

const day = 24 * 60 * 60 * 1000;
const admin = { sub: 'sub-admin', email: 'admin@example.com' };

describe('el nombre del dispositivo', () => {
  let server: SignInServer;
  let now = new Date('2026-11-07T12:00:00Z').getTime();
  const clock = { now: () => new Date(now) };
  const renames = () =>
    server.platform.audit
      .read(new Date(now).getUTCFullYear())
      .filter((e) => e.type === 'device.renamed');
  const signedIn = async () => {
    const device = createDevice(server);
    await device.signInWithGoogle(admin);
    return device;
  };

  beforeAll(async () => {
    server = await createSignInServer(clock);
  });
  afterAll(() => server.close());

  it('device-settings-E52, E56: lo pone desde Configuración; se ve en la entrada y queda anotado', async () => {
    const device = await signedIn();
    const queries = await server.countQueries(async () => {
      const named = await device.request('/api/me/device-name', { name: '  Compu del mostrador ' });
      expect(named).toMatchObject({
        status: 200,
        body: { name: 'Compu del mostrador', repeated: false },
      });
    });
    // La escritura, en su transacción con el aviso (el vínculo busca los suyos con ese dispositivo);
    // la primera vez de la sesión, también sus permisos para la cabecera.
    expect(queries).toBeLessThanOrEqual(5);
    expect((await device.request('/api/start')).body.deviceName).toBe('Compu del mostrador');
    // Sin sesión también, para la entrada de la computadora (01 · R2.5).
    await device.request('/api/sign-out', {});
    expect((await device.request('/api/start')).body.deviceName).toBe('Compu del mostrador');
    expect(renames().at(-1)).toMatchObject({
      targets: [{ kind: 'device', id: '', name: 'Chrome en Windows' }],
      changes: { name: { before: null, after: 'Compu del mostrador' } },
    });
  });

  it('device-settings-E56: cambiarlo anota el anterior y el nuevo; lo hecho antes sigue con el de entonces', async () => {
    const device = await signedIn();
    await device.request('/api/me/device-name', { name: 'Caja' });
    await device.request('/api/me/device-name', { name: 'Caja 2' });
    // Desde dónde se hizo, con el nombre que quedó; lo de antes, con el de entonces.
    const [first, second] = renames().slice(-2);
    expect(first?.device?.name).toBe('Caja');
    expect(second).toMatchObject({
      device: { name: 'Caja 2' },
      changes: { name: { before: 'Caja', after: 'Caja 2' } },
    });
    // Repetir el mismo no anota nada.
    const before = renames().length;
    await device.request('/api/me/device-name', { name: 'Caja 2' });
    expect(renames()).toHaveLength(before);
  });

  it('device-settings-E53: más de 30 letras no se guarda; 30 con tildes sí; sin caracteres invisibles', async () => {
    const device = await signedIn();
    const long = await device.request('/api/me/device-name', { name: 'a'.repeat(31) });
    expect(long.status).toBe(400);
    expect((await device.request('/api/me/device-name', {})).status).toBe(400);
    const accents = 'ñ'.repeat(30);
    expect((await device.request('/api/me/device-name', { name: accents })).body.name).toBe(
      accents,
    );
    const hidden = await device.request('/api/me/device-name', { name: 'Ca‮ja\u0007' });
    expect(hidden.body.name).toBe('Caja');
  });

  it('device-settings-E54: si otro se llama igual, avisa y lo guarda igual', async () => {
    const [one, other] = [await signedIn(), await signedIn()];
    await one.request('/api/me/device-name', { name: 'Mostrador' });
    const same = await other.request('/api/me/device-name', { name: 'mostrador' });
    expect(same.body).toEqual({ name: 'mostrador', repeated: true });
  });

  it('device-settings-E55: borrarlo vuelve al navegador y el sistema', async () => {
    const device = await signedIn();
    await device.request('/api/me/device-name', { name: 'Depósito' });
    const cleared = await device.request('/api/me/device-name', { name: '   ' });
    expect(cleared.body).toEqual({ name: null, repeated: false });
    expect((await device.request('/api/start')).body.deviceName).toBeUndefined();
    expect(renames().at(-1)?.changes).toEqual({ name: { before: 'Depósito', after: null } });
  });

  it('el nombre va al dispositivo de la sesión, aunque la cabecera diga otro; sin sesión, 401', async () => {
    const [device, other] = [await signedIn(), createDevice(server)];
    await device.request('/api/me/device-name', { name: 'Mío' }, { 'X-Device-Id': other.id });
    expect((await other.request('/api/start')).body.deviceName).toBeUndefined();
    expect((await device.request('/api/start')).body.deviceName).toBe('Mío');
    expect((await other.request('/api/me/device-name', { name: 'x' })).status).toBe(401);
  });

  it('como mucho 10 cambios por hora por sesión', async () => {
    const device = await signedIn();
    for (let i = 0; i < 10; i++)
      expect((await device.request('/api/me/device-name', { name: `N ${i}` })).status).toBe(200);
    expect((await device.request('/api/me/device-name', { name: 'Otro' })).status).toBe(429);
    now += 61 * 60_000;
  });

  it('device-settings-E59: el celular pregunta «¿Entrar en …?» con el nombre y el navegador de la computadora', async () => {
    const pc = await signedIn();
    await pc.request('/api/me/device-name', { name: 'Compu del mostrador' });
    await pc.request('/api/sign-out', {});
    const screen = await openScreen(server, pc);
    const phone = createDevice(server, { userAgent: androidPhone, ip: pc.ip });
    await phone.signInWithGoogle(admin);
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const options = await phone.request('/api/passkeys/options', {});
    await phone.request('/api/passkeys', { response: authenticator.create(options.body) });
    const read = await phone.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    expect(read.body.computer).toEqual({ label: 'Chrome en Windows', name: 'Compu del mostrador' });
    await screen.close();
  });

  it('device-settings-E58: el nombre de uno que nadie usa en un año se borra en la limpieza del día', async () => {
    const [unused, used] = [await signedIn(), await signedIn()];
    await unused.request('/api/me/device-name', { name: 'Viejo' });
    await used.request('/api/me/device-name', { name: 'Nuevo' });
    await unused.request('/api/sign-out', {});
    await server.runJobs();
    // Pasa más de un año: las sesiones cerradas ya se borraron; la del otro se sigue usando.
    for (let i = 0; i < 13; i++) {
      now += 30 * day;
      await used.signInWithGoogle(admin);
      await server.runJobs();
    }
    expect((await unused.request('/api/start')).body.deviceName).toBeUndefined();
    expect((await used.request('/api/start')).body.deviceName).toBe('Nuevo');
  });
});

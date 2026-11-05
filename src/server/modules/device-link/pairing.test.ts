// Vincular con el botón, en el servidor (capítulo 03, R1; E01, E03 a E06, E37): el código del QR de
// la computadora, leerlo con el celular, otra cuenta, reemplazar con boleto y volver a vincular.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { listen, otherPersonPhone, settle, signedIn, time } from '../../testing/device-link.ts';
import { createSignInServer, type SignInServer } from '../../testing/sign-in/sign-in-server.ts';

let server: SignInServer;
// Cada prueba un rato después: entrar con Google tiene un tope por minuto.
let now = new Date('2026-11-05T10:00:00Z').getTime();
const clock = { now: () => new Date(now) };
const audit = (type: string) =>
  server.platform.audit.read(2026).filter((event) => event.type === type);

beforeAll(async () => {
  server = await createSignInServer(clock, { wait: time.wait });
});
beforeEach(() => {
  now += 2 * 60_000;
});
afterAll(() => server.close());

// La computadora muestra su código; devuelve su canal y el último código.
async function showCode(computer: Awaited<ReturnType<typeof signedIn>>) {
  const tab = await listen(server, computer, 'device-link.code');
  return { tab, code: () => tab.last('device-link.code')?.code as string };
}

describe('vincular con el botón', () => {
  it('E01: el celular lee el código y quedan vinculados; la computadora se entera', async () => {
    const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
    const shown = await showCode(computer);
    const read = await phone.request('/api/device-link/codes/read', { code: shown.code() });
    expect(read.status).toBe(200);
    expect(read.body.pairing).toMatchObject({
      side: 'phone',
      other: { label: 'Chrome en Windows' },
    });
    await settle();
    expect(shown.tab.last('device-link.code')?.paired).toMatchObject({
      side: 'computer',
      other: { label: 'Chrome en Android' },
      paused: false,
    });
    expect(audit('device-link.paired').at(-1)?.data).toEqual({ how: 'button' });
    await shown.tab.close();
  });

  it('E03, E04: el código se renueva cada 60 s, vale solo el último y sirve una vez', async () => {
    const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
    const shown = await showCode(computer);
    const first = shown.code();
    time.elapse();
    await settle();
    expect(shown.code()).not.toBe(first);
    const old = await phone.request('/api/device-link/codes/read', { code: first });
    expect(old).toMatchObject({ status: 410, body: { error: 'code-expired' } });
    const code = shown.code();
    expect((await phone.request('/api/device-link/codes/read', { code })).status).toBe(200);
    // Ya usado: la computadora dejó de mostrarlo, y leerlo dice que venció (E04).
    const again = await phone.request('/api/device-link/codes/read', { code });
    expect(again).toMatchObject({ status: 410, body: { error: 'code-expired' } });
    await shown.tab.close();
    const unknown = await phone.request('/api/device-link/codes/read', { code: 'x'.repeat(22) });
    expect(unknown.body.error).toBe('code-expired');
  });

  it('E37: otra cuenta no vincula ni gasta el código; una computadora no lee códigos', async () => {
    const computer = await signedIn(server, false);
    const shown = await showCode(computer);
    const other = await otherPersonPhone(server, computer);
    const refused = await other.request('/api/device-link/codes/read', { code: shown.code() });
    expect(refused).toMatchObject({ status: 403, body: { error: 'other-account' } });
    expect(audit('device-link.rejected').at(-1)?.data).toEqual({ reason: 'other-account' });
    const notPhone = await computer.request('/api/device-link/codes/read', { code: shown.code() });
    expect(notPhone).toMatchObject({ status: 400, body: { error: 'not-a-phone' } });
    const phone = await signedIn(server, true);
    expect(
      (await phone.request('/api/device-link/codes/read', { code: shown.code() })).status,
    ).toBe(200);
    await shown.tab.close();
  });

  it('E05, E06: con otro vínculo pregunta antes; aceptar reemplaza y lo anota', async () => {
    const [first, second, phone] = [
      await signedIn(server, false),
      await signedIn(server, false),
      await signedIn(server, true),
    ];
    const one = await showCode(first);
    await phone.request('/api/device-link/codes/read', { code: one.code() });
    const two = await showCode(second);
    const asked = await phone.request('/api/device-link/codes/read', { code: two.code() });
    expect(asked.body.replaces).toEqual({ phone: 'Chrome en Windows' });
    const accepted = await phone.request('/api/device-link/codes/accept', {
      ticket: asked.body.ticket,
    });
    expect(accepted.status).toBe(200);
    expect(audit('device-link.replaced').length).toBeGreaterThan(0);
    // El boleto sirve una vez.
    const twice = await phone.request('/api/device-link/codes/accept', {
      ticket: asked.body.ticket,
    });
    expect(twice.body.error).toBe('code-expired');
    await one.tab.close();
    await two.tab.close();
  });

  it('el boleto no sirve desde otra sesión ni si cambió lo que reemplazaba', async () => {
    const [first, second, phone] = [
      await signedIn(server, false),
      await signedIn(server, false),
      await signedIn(server, true),
    ];
    const one = await showCode(first);
    await phone.request('/api/device-link/codes/read', { code: one.code() });
    const two = await showCode(second);
    const asked = await phone.request('/api/device-link/codes/read', { code: two.code() });
    const intruder = await signedIn(server, true);
    const stolen = await intruder.request('/api/device-link/codes/accept', {
      ticket: asked.body.ticket,
    });
    expect(stolen.body.error).toBe('code-expired');
    const asked2 = await phone.request('/api/device-link/codes/read', { code: two.code() });
    expect(asked2.body.error).toBe('code-used');
    // Mientras tanto se desvincularon: ya no hay qué reemplazar, el boleto vence.
    const three = await showCode(second);
    const asked3 = await phone.request('/api/device-link/codes/read', { code: three.code() });
    await phone.request('/api/device-link/unpair', {});
    const late = await phone.request('/api/device-link/codes/accept', {
      ticket: asked3.body.ticket,
    });
    expect(late.body.error).toBe('code-expired');
    for (const tab of [one.tab, two.tab, three.tab]) await tab.close();
  });

  it('volver a vincular los mismos dos lo renueva sin reemplazar', async () => {
    const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
    const shown = await showCode(computer);
    const first = await phone.request('/api/device-link/codes/read', { code: shown.code() });
    const again = await showCode(computer);
    const second = await phone.request('/api/device-link/codes/read', { code: again.code() });
    expect(second.body.pairing.id).toBe(first.body.pairing.id);
    await shown.tab.close();
    await again.tab.close();
  });

  it('el código vence si la computadora dejó de escucharlo', async () => {
    const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
    const shown = await showCode(computer);
    const code = shown.code();
    await shown.tab.close();
    const read = await phone.request('/api/device-link/codes/read', { code });
    expect(read.body.error).toBe('code-expired');
    expect((await listen(server, phone, 'device-link.code')).status).toBe(403);
  });

  it('E06: si la computadora ya tenía otro celular también pregunta; con su sesión cerrada, vence', async () => {
    const [computer, firstPhone, secondPhone] = [
      await signedIn(server, false),
      await signedIn(server, true),
      await signedIn(server, true),
    ];
    const one = await showCode(computer);
    await firstPhone.request('/api/device-link/codes/read', { code: one.code() });
    const two = await showCode(computer);
    const asked = await secondPhone.request('/api/device-link/codes/read', { code: two.code() });
    expect(asked.body.replaces).toEqual({ computer: true });
    await computer.request('/api/sign-out', {});
    const late = await secondPhone.request('/api/device-link/codes/accept', {
      ticket: asked.body.ticket,
    });
    expect(late.body.error).toBe('code-expired');
    await one.tab.close();
    await two.tab.close();
  });

  it('un código de una computadora que ya no tiene sesión vence', async () => {
    const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
    const shown = await showCode(computer);
    const code = shown.code();
    await computer.request('/api/sign-out', {});
    expect((await phone.request('/api/device-link/codes/read', { code })).body.error).toBe(
      'code-expired',
    );
  });

  it('un código vence en cuanto vence la sesión de la computadora, antes del próximo latido', async () => {
    const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
    const shown = await showCode(computer);
    // La sesión de la computadora venció por falta de uso; su canal se cierra recién en el latido.
    const closed = vi.spyOn(server.platform.sessions, 'isOpen').mockReturnValue(false);
    const read = await phone.request('/api/device-link/codes/read', { code: shown.code() });
    closed.mockRestore();
    expect(read.body.error).toBe('code-expired');
    await shown.tab.close();
  });
});

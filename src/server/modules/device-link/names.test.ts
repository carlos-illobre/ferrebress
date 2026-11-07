// El nombre de cada dispositivo en el vínculo (04 · R9.4; diseño de 04b, § 5): cada lado ve el del
// otro, con la etiqueta de respaldo, y se entera cuando cambia. Quitarle la huella al celular en la
// mano no termina el vínculo (04 · E60).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testConfig } from '../../testing/config.ts';
import { listen, settle, signedIn, time } from '../../testing/device-link.ts';
import { createAuthenticator } from '../../testing/sign-in/authenticator.ts';
import { createSignInServer, type SignInServer } from '../../testing/sign-in/sign-in-server.ts';

let server: SignInServer;
let now = new Date('2026-11-07T10:00:00Z').getTime();
const clock = { now: () => new Date(now) };

beforeAll(async () => {
  server = await createSignInServer(clock, { wait: time.wait });
});
afterAll(() => server.close());

type Device = Awaited<ReturnType<typeof signedIn>>;

// Vinculados con el botón: la computadora muestra su código y el celular lo lee.
async function paired() {
  now += 2 * 60_000;
  const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
  const shown = await listen(server, computer, 'device-link.code');
  await phone.request('/api/device-link/codes/read', {
    code: shown.last('device-link.code')?.code,
  });
  await shown.close();
  return { computer, phone };
}
const otherOf = async (device: Device) =>
  (await device.request('/api/device-link/check')).body.pairing?.other.label;

describe('el nombre en el vínculo', () => {
  it('device-settings-E52, E55: cada lado ve el nombre del otro, se entera al cambiar y vuelve la etiqueta al borrarlo', async () => {
    const { computer, phone } = await paired();
    const { id } = (await phone.request('/api/device-link/check')).body.pairing;
    const tab = await listen(server, phone, `device-link.pairing:${id}`);
    await computer.request('/api/me/device-name', { name: 'Caja' });
    await settle();
    expect(tab.last('device-link.pairing')?.pairing).toMatchObject({ other: { label: 'Caja' } });
    expect(await otherOf(phone)).toBe('Caja');
    expect(await otherOf(computer)).toBe('Chrome en Android');
    await computer.request('/api/me/device-name', { name: '' });
    await settle();
    expect(tab.last('device-link.pairing')?.pairing).toMatchObject({
      other: { label: 'Chrome en Windows' },
    });
    await tab.close();
    // Lo que se anota del vínculo, con el nombre de ese momento.
    await phone.request('/api/me/device-name', { name: 'Celu de Ana' });
    await phone.request('/api/device-link/unpair', {});
    const unpaired = server.platform.audit
      .read(2026)
      .filter((event) => event.type === 'device-link.unpaired')
      .at(-1);
    expect(unpaired?.targets?.slice(1)).toEqual([
      { kind: 'phone', id: '', name: 'Celu de Ana' },
      { kind: 'computer', id: '', name: 'Chrome en Windows' },
    ]);
  });

  it('device-settings-E60: quitarle la huella al celular en la mano no termina el vínculo', async () => {
    const { computer, phone } = await paired();
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const options = await phone.request('/api/passkeys/options', {});
    await phone.request('/api/passkeys', { response: authenticator.create(options.body) });
    const removed = await phone.request('/api/me/passkey/remove', {});
    expect(removed.body).toEqual({ sessions: 0, passkey: true });
    expect(await otherOf(computer)).toBe('Chrome en Android');
    expect(await otherOf(phone)).toBe('Chrome en Windows');
  });
});

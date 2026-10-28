// Las pantallas con QR que no se quedan con su lugar (revisión de seguridad, puntos 25 y 26): la que
// nunca abre su canal se libera sola, y cada pantalla tiene un solo canal.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { appHeaders } from '../../../testing/config.ts';
import { manualWait, openScreen } from '../../../testing/screen-channel.ts';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in-server.ts';

describe('las pantallas con QR y sus canales', () => {
  let server: SignInServer;
  let now = new Date('2026-10-27T08:00:00Z').getTime();
  let network = 0;
  let ip = '';
  const time = manualWait();
  const computer = () => {
    ip = `190.8.0.${++network}`;
    return createDevice(server, { ip });
  };

  beforeAll(async () => {
    server = await createSignInServer({ now: () => new Date(now) }, { wait: time.wait });
  });
  afterAll(() => server.close());

  it('una pantalla que no abre su canal se libera a los 30 s', async () => {
    computer();
    const sameNetwork = () => createDevice(server, { ip });
    for (let i = 0; i < 3; i++)
      expect((await sameNetwork().request('/api/sign-in/codes', {})).status).toBe(200);
    expect((await sameNetwork().request('/api/sign-in/codes', {})).status).toBe(429);
    now += 30_000;
    expect((await sameNetwork().request('/api/sign-in/codes', {})).status).toBe(200);
  });

  it('un canal nuevo de la misma pantalla corta el anterior sin cerrarla', async () => {
    const screen = await openScreen(server, computer());
    const before = screen.events.length;
    const again = await server.http.request('/api/realtime/sign-in-codes', {
      headers: { ...appHeaders(), Cookie: screen.cookie },
    });
    expect(again.status).toBe(200);
    await screen.settle();
    time.elapse();
    await screen.settle();
    // El canal viejo ya no recibe los códigos nuevos; el nuevo sí.
    expect(screen.events.length).toBe(before);
    const reader = (again.body as ReadableStream<Uint8Array>).getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain('event: code');
    await reader.cancel();
  });
});

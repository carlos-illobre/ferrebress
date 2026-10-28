// Las pantallas con QR que no se quedan con su lugar (revisión de seguridad, puntos 25 y 26): la que
// nunca abre su canal se libera sola, y cada pantalla tiene un solo canal.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { appHeaders } from '../../../testing/config.ts';
import { manualWait, openScreen } from '../../../testing/sign-in/screen-channel.ts';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in/sign-in-server.ts';

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

  it('cambiar el permiso con un cuerpo mal formado es un pedido mal hecho', async () => {
    const pc = computer();
    const screen = await openScreen(server, pc);
    pc.cookie = screen.cookie;
    expect((await pc.request('/api/sign-in/codes/claim', { permit: 'x' })).status).toBe(400);
    await screen.close();
  });

  it('recargar la pestaña reemplaza su pantalla: no cuenta para el tope, y corta el canal viejo', async () => {
    const pc = computer();
    const [a, b, c, d] = [1, 2, 3, 4].map((n) => `00000000-0000-4000-8000-00000000000${n}`);
    const first = await openScreen(server, pc, a);
    for (const tab of [b, c])
      expect((await pc.request('/api/sign-in/codes', { tab })).status).toBe(200);
    // Ya hay 3 de esta dirección: una pestaña nueva no entra, pero recargar la primera sí.
    expect((await pc.request('/api/sign-in/codes', { tab: d })).status).toBe(429);
    const reloaded = await openScreen(server, pc, a);
    expect(reloaded.lastCode()).toBeDefined();
    const before = first.events.length;
    time.elapse();
    await reloaded.settle();
    expect(first.events.length).toBe(before);
    // La pantalla vieja ya no existe: su cookie no sirve para su canal.
    const old = await server.http.request('/api/realtime/sign-in-codes', {
      headers: { ...appHeaders(), Cookie: first.cookie },
    });
    expect(old.status).toBe(404);
    expect((await pc.request('/api/sign-in/codes', { tab: 'x' })).status).toBe(400);
    await reloaded.close();
  });

  it('recargar tiene su propio tope, más alto, y no gasta el de pantallas nuevas', async () => {
    const pc = computer();
    const tab = '00000000-0000-4000-8000-0000000000aa';
    expect((await pc.request('/api/sign-in/codes', { tab })).status).toBe(200);
    const statuses = [];
    for (let i = 0; i < 61; i++)
      statuses.push((await pc.request('/api/sign-in/codes', { tab })).status);
    expect(statuses.slice(0, 60).every((status) => status === 200)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
    // Las 60 recargas no gastaron el tope de pantallas nuevas de esta dirección.
    const other = '00000000-0000-4000-8000-0000000000bb';
    expect((await pc.request('/api/sign-in/codes', { tab: other })).status).toBe(200);
  });

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

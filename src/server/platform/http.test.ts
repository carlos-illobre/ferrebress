import type { AddressInfo } from 'node:net';
import { parseServerHeader } from '@ferrebress/shared/contracts/server-header';
import { serve } from '@hono/node-server';
import { describe, expect, it } from 'vitest';
import { inMemoryAudit, openAuditLog } from './audit.ts';
import { createHttp } from './http.ts';
import { createRateLimiter } from './rate-limit.ts';

const origin = 'https://ferrebress-pruebas.duckdns.org';
const now = new Date('2026-10-27T12:00:00Z');

function setUp(remote: string | null = '172.20.0.2') {
  const audit = openAuditLog(inMemoryAudit);
  const clock = { now: () => now };
  const http = createHttp({
    environment: 'testing',
    version: 'abc123',
    publicOrigin: origin,
    trustedProxy: '172.20.0.2',
    clock,
    audit,
    limiter: createRateLimiter(clock),
    remoteAddress: () => remote ?? undefined,
  });
  http.get('/api/echo', (c) =>
    c.json({ ip: c.get('ipAddress'), device: c.get('deviceId') ?? null }),
  );
  http.post('/api/echo', async (c) => c.json(await c.req.json()));
  http.get('/api/boom', () => {
    throw new Error('se rompió');
  });
  const rejected = () => audit.read(2026).filter((event) => event.type === 'request.rejected');
  return { http, rejected };
}

const post = (body: unknown, headers: Record<string, string> = {}) => ({
  method: 'POST',
  body: JSON.stringify(body),
  headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
});

describe('todo pedido de /api', () => {
  it('lleva la versión, la hora del servidor y el ambiente, y no se guarda en caché', async () => {
    const response = await setUp().http.request('/api/echo');
    expect(parseServerHeader(response.headers.get('X-Ferrebress'))).toEqual({
      version: 'abc123',
      serverTime: now.getTime(),
      environment: 'testing',
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('toma la dirección real de la cabecera solo si el pedido viene de Caddy', async () => {
    const headers = { 'X-Forwarded-For': '190.1.2.3, 10.0.0.1' };
    const fromCaddy = await setUp().http.request('/api/echo', { headers });
    expect(await fromCaddy.json()).toMatchObject({ ip: '190.1.2.3' });
    const direct = await setUp('10.9.9.9').http.request('/api/echo', { headers });
    expect(await direct.json()).toMatchObject({ ip: '10.9.9.9' });
    const unknown = await setUp('172.20.0.2').http.request('/api/echo');
    expect(await unknown.json()).toMatchObject({ ip: '172.20.0.2' });
  });

  it('acepta un pedido que cambia algo desde la propia aplicación', async () => {
    const response = await setUp().http.request('/api/echo', post({ hola: 1 }));
    expect(await response.json()).toEqual({ hola: 1 });
  });

  it.each([
    ['otro origen', post({}, { Origin: 'https://malo.example' })],
    ['sin origen', { method: 'POST', headers: { 'Content-Type': 'application/json' } }],
    ['sin cuerpo ni tipo', { method: 'POST', headers: { Origin: origin } }],
    ['otro tipo', post({}, { 'Content-Type': 'text/plain' })],
    ['un dispositivo que no es un UUID', post({}, { 'X-Device-Id': 'x' })],
    ['un cuerpo de más de 64 KB', post({ texto: 'x'.repeat(65 * 1024) })],
  ])('rechaza %s y lo anota', async (_, init) => {
    const { http, rejected } = setUp();
    const response = await http.request('/api/echo', init);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'bad-request' });
    expect(rejected()).toHaveLength(1);
  });

  it('pide actualizar a una aplicación con un contrato viejo', async () => {
    const response = await setUp().http.request('/api/echo', { headers: { 'X-App-Version': '0' } });
    expect(response.status).toBe(426);
    expect(await response.json()).toEqual({ error: 'update-required' });
  });

  it('anota un rechazo por ventana y en la siguiente cuántos se repitieron', async () => {
    let time = now.getTime();
    const audit = openAuditLog(inMemoryAudit);
    const clock = { now: () => new Date(time) };
    const http = createHttp({
      environment: 'testing',
      version: 'v',
      publicOrigin: origin,
      trustedProxy: 'x',
      clock,
      audit,
      limiter: createRateLimiter(clock),
      remoteAddress: () => '1.1.1.1',
    });
    const bad = { method: 'POST', headers: { Origin: 'https://malo.example' } };
    for (let i = 0; i < 5; i++) await http.request('/api/echo', bad);
    time += 60_000;
    await http.request('/api/echo', bad);
    const data = audit.read(2026).map((event) => event.data);
    expect(data).toEqual([
      { reason: 'origin', path: '/api/echo' },
      { reason: 'origin', path: '/api/echo', repeatedBefore: 4 },
    ]);
  });

  it('acepta un dispositivo bien identificado', async () => {
    const id = '0192d3a4-1b2c-7d3e-8f40-123456789abc';
    const response = await setUp().http.request('/api/echo', { headers: { 'X-Device-Id': id } });
    expect(await response.json()).toMatchObject({ device: id });
  });

  it('lo que no existe es not-found y un error inesperado no muestra el detalle', async () => {
    const { http } = setUp();
    expect(await (await http.request('/api/nada')).json()).toEqual({ error: 'not-found' });
    const boom = await http.request('/api/boom');
    expect(boom.status).toBe(500);
    expect(await boom.json()).toEqual({ error: 'unexpected' });
  });

  it('sin dirección conocida la anota como desconocida', async () => {
    const response = await setUp(null).http.request('/api/echo');
    expect(await response.json()).toMatchObject({ ip: 'desconocida' });
  });

  it('en un servidor de verdad toma la dirección de la conexión', async () => {
    const audit = openAuditLog(inMemoryAudit);
    const clock = { now: () => now };
    const http = createHttp({
      ...{ environment: 'testing', version: 'v', publicOrigin: origin, trustedProxy: 'x' },
      ...{ clock, audit, limiter: createRateLimiter(clock) },
    });
    http.get('/api/echo', (c) => c.json({ ip: c.get('ipAddress') }));
    const server = serve({ fetch: http.fetch, port: 0, hostname: '127.0.0.1' });
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/api/echo`);
    expect(await response.json()).toEqual({ ip: '127.0.0.1' });
    server.close();
  });
});

// Presentarse, el respaldo y lo que el vínculo suma a cada pedido, en el servidor (diseño de 03, § 3.5,
// § 4, § 7; capítulo 03, R2.6, R3; E18, E38, E39).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { listen, settle, signedIn, time } from '../../testing/device-link.ts';
import { createSignInServer, type SignInServer } from '../../testing/sign-in/sign-in-server.ts';

let server: SignInServer;
let now = new Date('2026-11-06T10:00:00Z').getTime();
const clock = { now: () => new Date(now) };

beforeAll(async () => {
  server = await createSignInServer(clock, { wait: time.wait });
});
afterAll(() => server.close());
beforeEach(() => {
  now += 2 * 60_000;
});

const offer = (fingerprint: string) =>
  [
    'v=0',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    `a=fingerprint:sha-256 ${fingerprint}`,
    'a=candidate:1 1 udp 2122260223 4c1f0b2e-1111-2222-3333-444455556666.local 54321 typ host',
    'a=candidate:2 1 udp 2122260223 192.168.0.10 54322 typ host',
    'a=candidate:3 1 udp 2122260223 2800:810:4ab::1 54323 typ host',
    'a=candidate:4 1 tcp 1518280447 192.168.0.10 9 typ host tcptype active',
    'a=candidate:5 1 udp 1686052607 181.1.2.3 54324 typ srflx raddr 0.0.0.0 rport 0',
  ].join('\r\n');

// Vinculados y los dos escuchando su lado del vínculo.
async function together() {
  const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
  const codes = await listen(server, computer, 'device-link.code');
  const code = codes.last('device-link.code')?.code as string;
  const id = (await phone.request('/api/device-link/codes/read', { code })).body.pairing.id;
  await codes.close();
  const phoneTab = await listen(server, phone, `device-link.pairing:${id}`);
  const computerTab = await listen(server, computer, `device-link.pairing:${id}`);
  return { computer, phone, id, phoneTab, computerTab };
}

describe('presentarse', () => {
  it('la oferta llega al otro solo con las direcciones del Wi-Fi en UDP, y la huella queda registrada', async () => {
    const { computer, phone, phoneTab, computerTab } = await together();
    const sent = await computer.request('/api/device-link/signal', {
      attempt: '0a1b2c3d',
      kind: 'offer',
      sdp: offer('AA:BB'),
    });
    expect(sent.status).toBe(200);
    await settle();
    const { signal } = phoneTab.last('device-link.pairing') as { signal: { sdp: string } };
    expect(signal.sdp).toContain('.local 54321');
    expect(signal.sdp).toContain('192.168.0.10 54322');
    expect(signal.sdp).not.toContain('2800:810');
    expect(signal.sdp).not.toContain('tcp');
    expect(signal.sdp).not.toContain('srflx');
    // El celular confirma al otro con la huella que el servidor registró de la computadora.
    expect((await phone.request('/api/device-link/check?fp=sha-256%20AA:BB')).body.peer).toBe('ok');
    expect((await phone.request('/api/device-link/check?fp=sha-256%20CC')).body.peer).toBe('gone');
    await phoneTab.close();
    await computerTab.close();
  });

  it('sin el otro escuchando, sin vínculo o con una descripción que no es un canal de datos, no pasa', async () => {
    const { computer, phoneTab, computerTab } = await together();
    const video = { attempt: '0a1b2c3d', kind: 'offer', sdp: 'v=0\r\nm=video 9 UDP 96' };
    expect((await computer.request('/api/device-link/signal', video)).status).toBe(400);
    const noPrint = { ...video, sdp: 'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel' };
    expect((await computer.request('/api/device-link/signal', noPrint)).status).toBe(400);
    await phoneTab.close();
    const absent = await computer.request('/api/device-link/signal', video);
    expect(absent).toMatchObject({ status: 409, body: { error: 'peer-absent' } });
    const stranger = await signedIn(server, true);
    expect((await stranger.request('/api/device-link/signal', video)).body.error).toBe(
      'not-paired',
    );
    await computerTab.close();
  });
});

describe('el respaldo por el servidor', () => {
  it('E18: pasa los mensajes al otro lado, y cuenta que espejaron', async () => {
    const { computer, phoneTab, computerTab } = await together();
    const sent = await computer.request('/api/device-link/relay', { messages: [{ t: 'hello' }] });
    expect(sent.status).toBe(200);
    await settle();
    expect(phoneTab.last('device-link.pairing')).toEqual({ relay: [{ t: 'hello' }] });
    await server.runJobs();
    await phoneTab.close();
    await computerTab.close();
  });

  it('E39: con la sesión del otro cerrada, no pasa nada; y tiene un tope por minuto', async () => {
    const { computer, phone, phoneTab, computerTab } = await together();
    const many = { messages: Array.from({ length: 100 }, (_, i) => ({ i })) };
    for (let i = 0; i < 6; i++) await computer.request('/api/device-link/relay', many);
    const capped = await computer.request('/api/device-link/relay', many);
    expect(capped.status).toBe(429);
    // Y en bytes: pocos mensajes grandes también topan (1 MB por minuto).
    now += 2 * 60_000;
    const big = { messages: [{ v: 'x'.repeat(60 * 1024) }] };
    const sent = [];
    for (let i = 0; i < 18; i++)
      sent.push((await computer.request('/api/device-link/relay', big)).status);
    expect(sent.slice(0, 16)).toEqual(Array(16).fill(200));
    expect(sent.at(-1)).toBe(429);
    await phone.request('/api/sign-out', {});
    const gone = await computer.request('/api/device-link/relay', { messages: [1] });
    expect(gone.body.error).toMatch(/peer-(gone|absent)/);
    await phoneTab.close();
    await computerTab.close();
  });

  it('el aviso de que falló el directo va al registro, sin direcciones', async () => {
    const { computer, phoneTab, computerTab } = await together();
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const report = {
      attempt: '0a1b2c3d',
      outcome: 'direct-failed',
      ice: { host: 2, mdns: 2, pairs: 0, state: 'failed' },
    };
    expect((await computer.request('/api/device-link/report', report)).status).toBe(200);
    expect(info.mock.calls[0]?.[0]).toContain('"outcome":"direct-failed"');
    info.mockRestore();
    const stranger = await signedIn(server, false);
    expect((await stranger.request('/api/device-link/report', report)).status).toBe(409);
    await phoneTab.close();
    await computerTab.close();
  });
});

describe('lo que el vínculo suma a cada pedido', () => {
  it('la huella l= cambia si se pausa o si el otro deja de escuchar; sin vínculo no va', async () => {
    const { computer, phone, phoneTab, computerTab } = await together();
    const field = async () =>
      /l=([0-9a-f]{8})/.exec((await computer.request('/api/device-link/check')).header ?? '')?.[1];
    const first = await field();
    expect(first).toMatch(/^[0-9a-f]{8}$/);
    await phone.request('/api/device-link/pause', {});
    const paused = await field();
    expect(paused).not.toBe(first);
    await phoneTab.close();
    expect(await field()).not.toBe(paused);
    const stranger = await signedIn(server, false);
    expect((await stranger.request('/api/device-link/check')).header).not.toContain('l=');
    await computerTab.close();
  });

  it('una escritura con el vínculo pasa mientras sigue; terminado, o con el otro sin sesión, 409', async () => {
    const { computer, phone, phoneTab, computerTab } = await together();
    const write = (pairing: string, path = '/api/users') =>
      server.http.request(path, {
        method: 'POST',
        body: '{}',
        headers: {
          'X-Device-Id': phone.id,
          'X-App-Version': '1',
          'User-Agent': phone.userAgent,
          Cookie: phone.cookie,
          Origin: 'https://ferrebress-pruebas.duckdns.org',
          'Content-Type': 'application/json',
          'X-Pairing': pairing,
        },
      });
    const id = (await phone.request('/api/device-link/check')).body.pairing.id;
    expect((await write(id)).status).not.toBe(409);
    expect((await write('otro')).status).toBe(409);
    await computer.request('/api/sign-out', {});
    expect(await (await write(id)).json()).toEqual({ error: 'pairing-ended' });
    // Lo que no es del espejo pasa igual: desconectar y salir andan con el vínculo terminado.
    expect((await write(id, '/api/device-link/pause')).status).toBe(200);
    expect((await write(id, '/api/sign-out')).status).toBe(200);
    expect((await phone.request('/api/device-link/check')).status).toBe(401);
    await phoneTab.close();
    await computerTab.close();
  });

  it('E39: con el otro todavía escuchando pero su sesión vencida, el respaldo no pasa', async () => {
    const { phone, phoneTab, computerTab } = await together();
    now += 31 * 60_000;
    await phone.request('/api/device-link/check');
    now += 31 * 60_000;
    const gone = await phone.request('/api/device-link/relay', { messages: [1] });
    expect(gone).toMatchObject({ status: 409, body: { error: 'peer-gone' } });
    await phoneTab.close();
    await computerTab.close();
  });

  it('una escritura con un vínculo y sin sesión no pasa; dos pestañas del mismo lado cuentan como una', async () => {
    const { computer, id, phoneTab, computerTab } = await together();
    const anonymous = await server.http.request('/api/users', {
      method: 'POST',
      body: '{}',
      headers: {
        'X-Device-Id': computer.id,
        'X-App-Version': '1',
        Origin: 'https://ferrebress-pruebas.duckdns.org',
        'Content-Type': 'application/json',
        'X-Pairing': id,
      },
    });
    expect(anonymous.status).toBe(409);
    const second = await listen(server, computer, `device-link.pairing:${id}`);
    await second.close();
    expect(phoneTab.last('device-link.pairing')).toMatchObject({ present: true });
    await phoneTab.close();
    await computerTab.close();
  });
});

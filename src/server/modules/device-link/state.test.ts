// El vínculo ya hecho, en el servidor (capítulo 03, R2, R5, R8; E10 a E17, E27 a E30, E38, E39, E41,
// E42): saber si el otro está, desconectar y reconectar, desvincular, confirmar, y lo que lo termina.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { listen, settle, signedIn, time } from '../../testing/device-link.ts';
import { createSignInServer, type SignInServer } from '../../testing/sign-in/sign-in-server.ts';

let server: SignInServer;
let now = new Date('2026-11-05T10:00:00Z').getTime();
const clock = { now: () => new Date(now) };
const audit = (type: string) =>
  server.platform.audit.read(2026).filter((event) => event.type === type);

beforeAll(async () => {
  server = await createSignInServer(clock, { wait: time.wait });
});
afterAll(() => server.close());
beforeEach(() => {
  now += 2 * 60_000;
});

// Una computadora y un celular de la misma persona, ya vinculados con el botón.
async function linked() {
  const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
  const tab = await listen(server, computer, 'device-link.code');
  const code = tab.last('device-link.code')?.code as string;
  const read = await phone.request('/api/device-link/codes/read', { code });
  await tab.close();
  return { computer, phone, id: read.body.pairing.id as string };
}

const publish = (name: never, payload: never) =>
  server.platform.events.transaction(server.platform.db, (_trx, send) => send(name, payload));

describe('el otro lado', () => {
  it('se enteran si el otro está, y presentarse les da el mismo intento a los dos', async () => {
    const { computer, phone, id } = await linked();
    const phoneTab = await listen(server, phone, `device-link.pairing:${id}`);
    expect(phoneTab.last('device-link.pairing')).toEqual({ present: false });
    const computerTab = await listen(server, computer, `device-link.pairing:${id}`);
    await settle();
    const attempt = computerTab.last('device-link.pairing')?.attempt;
    expect(attempt).toMatch(/^[0-9a-f]{8}$/);
    expect(phoneTab.last('device-link.pairing')).toEqual({ present: true, attempt });
    await computerTab.close();
    expect(phoneTab.last('device-link.pairing')).toEqual({ present: false });
    await phoneTab.close();
  });

  it('E38: escuchar un vínculo que no es el suyo, o sin vínculo, se rechaza', async () => {
    const { id } = await linked();
    const stranger = await signedIn(server, true);
    expect((await listen(server, stranger, `device-link.pairing:${id}`)).status).toBe(403);
    const anonymousTab = await server.http.request(`/api/realtime?s=device-link.pairing:${id}`, {
      headers: { 'X-Device-Id': '0192d3a4-1b2c-7d3e-8f40-123456789abc', 'X-App-Version': '1' },
    });
    expect(anonymousTab.status).toBe(401);
  });
});

describe('desconectar, reconectar, desvincular y confirmar', () => {
  it('E27, E29: desconectar y reconectar quedan guardados y el otro se entera', async () => {
    const { computer, phone, id } = await linked();
    const computerTab = await listen(server, computer, `device-link.pairing:${id}`);
    const paused = await phone.request('/api/device-link/pause', {});
    expect(paused.body.pairing).toMatchObject({ side: 'phone', paused: true });
    await settle();
    expect(computerTab.last('device-link.pairing')?.pairing).toMatchObject({ paused: true });
    expect((await computer.request('/api/device-link/check')).body.pairing.paused).toBe(true);
    await computer.request('/api/device-link/resume', {});
    expect((await phone.request('/api/device-link/check')).body.pairing.paused).toBe(false);
    await computerTab.close();
    // E42: nada de esto queda en la auditoría.
    expect(audit('device-link.paused')).toHaveLength(0);
  });

  it('E30, E41: desvincular termina el vínculo para los dos, lo anota, y el que escuchaba lo suelta', async () => {
    const { computer, phone, id } = await linked();
    const computerTab = await listen(server, computer, `device-link.pairing:${id}`);
    expect((await phone.request('/api/device-link/unpair', {})).body).toEqual({ ok: true });
    await settle();
    expect(computerTab.last('dropped')).toEqual({ topic: `device-link.pairing:${id}` });
    expect(audit('device-link.unpaired').at(-1)?.data).toEqual({ from: 'phone' });
    expect((await computer.request('/api/device-link/check')).body).toEqual({});
    const again = await phone.request('/api/device-link/unpair', {});
    expect(again).toMatchObject({ status: 409, body: { error: 'not-paired' } });
    for (const path of ['/api/device-link/pause', '/api/device-link/resume'])
      expect((await phone.request(path, {})).status).toBe(409);
    await computerTab.close();
  });

  it('confirmar sin la huella del otro trae el vínculo; con una que no es la registrada, «gone»', async () => {
    const { computer } = await linked();
    const plain = await computer.request('/api/device-link/check');
    expect(plain.body.pairing.side).toBe('computer');
    const withPrint = await computer.request('/api/device-link/check?fp=sha-256%20AA');
    expect(withPrint.body.peer).toBe('gone');
  });
});

describe('lo que termina el vínculo', () => {
  it('E14, E15, E16: cerrar una sesión desde Usuarios, cortar el celular o la baja lo terminan', async () => {
    const reasons: string[] = [];
    const cases = [
      ['sessions.revoked', (d: { computer: { id: string } }) => ({ deviceIds: [d.computer.id] })],
      [
        'passkey.removed',
        (d: { phone: { id: string } }) => ({ deviceId: d.phone.id, cause: 'cut' }),
      ],
      [
        'passkey.removed',
        (d: { phone: { id: string } }) => ({ deviceId: d.phone.id, cause: 'removed' }),
      ],
    ] as const;
    const userId = (await (await signedIn(server, false)).request('/api/start')).body.person.userId;
    for (const [name, payloadOf] of cases) {
      const pair = await linked();
      await publish(name as never, { userId, ...payloadOf(pair as never) } as never);
      expect((await pair.phone.request('/api/device-link/check')).body).toEqual({});
      reasons.push(audit('device-link.ended').at(-1)?.data?.reason as string);
    }
    expect(reasons).toEqual(['session-revoked', 'phone-cut', 'passkey-removed']);
  });

  it('E07, E08: entrar a la computadora con el celular los vincula, reemplazando sin preguntar', async () => {
    const first = await linked();
    const newComputer = await signedIn(server, false);
    const userId = (await first.phone.request('/api/start')).body.person.userId;
    await publish(
      'sign-in.phone-approved' as never,
      {
        userId,
        phoneDeviceId: first.phone.id,
        phoneLabel: 'Chrome en Android',
        computerDeviceId: newComputer.id,
        computerLabel: 'Chrome en Windows',
      } as never,
    );
    expect((await newComputer.request('/api/device-link/check')).body.pairing.side).toBe(
      'computer',
    );
    expect((await first.computer.request('/api/device-link/check')).body).toEqual({});
    expect(audit('device-link.paired').at(-1)?.data).toEqual({ how: 'sign-in' });
  });

  it('E12: vence a los 30 días sin espejar; salir no lo termina (E10, E17)', async () => {
    const { computer, phone } = await linked();
    await computer.request('/api/sign-out', {});
    expect((await phone.request('/api/device-link/check')).body.pairing).toBeDefined();
    now += 31 * 24 * 60 * 60 * 1000;
    await server.runJobs();
    expect(audit('device-link.ended').at(-1)?.data).toEqual({ reason: 'expired' });
  });
});

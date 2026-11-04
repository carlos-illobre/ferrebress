// Las piezas del vínculo vivo, una por una, con un `Live` de mentira: lo que la simulación de dos
// dispositivos no alcanza (bordes de carreras, topes y defensas).
import type { PairingView } from '@ferrebress/shared/contracts/device-link';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod/mini';
import { createMirror } from '../../../platform/mirror/registry.ts';
import { directSettings } from '../../../platform/peer/direct.ts';
import { reconnectDelaysMs } from '../../../platform/server/reconnect.ts';
import { createStore } from '../../../platform/store.ts';
import { fakeLink, fakeLive } from '../../../testing/live.ts';
import { pc } from '../../../testing/pairing.ts';
import { createWifi } from '../../../testing/wifi.ts';
import { createConfirm } from '../confirm.ts';
import type { PairingState } from '../machine/types.ts';
import { createRuntime, type Deps } from '../runtime.ts';
import { runners } from './commands.ts';
import { answerOffer, closeTransport, onRelay, onSignal, openDirect, promote } from './links.ts';
import { runtimeSettings } from './live.ts';
import { attachMirror, sendHello, sendSnapshot } from './mirror-port.ts';
import { subscribe } from './topic.ts';

const waiting: PairingState = { kind: 'waiting', pairing: pc };
const direct = (attempt = 'a'): PairingState => ({ kind: 'direct', pairing: pc, attempt });

afterEach(() => vi.useRealTimers());

describe('abrir y cerrar conexiones', () => {
  it('una respuesta sin directo que la espere, o de otro intento, no hace nada', () => {
    const { live } = fakeLive(waiting);
    expect(() => onSignal(live, { attempt: 'a', kind: 'answer', sdp: 'x' })).not.toThrow();
    const { link } = fakeLink(live);
    live.opening = link;
    onSignal(live, { attempt: 'b', kind: 'answer', sdp: 'x' });
    expect(link.peerFingerprint).toBeUndefined();
  });

  it('una oferta que no corresponde al estado espera', () => {
    const { live } = fakeLive(waiting);
    onSignal(live, { attempt: 'a', kind: 'offer', sdp: 'x' });
    expect(live.offer).toEqual({ attempt: 'a', sdp: 'x' });
    const conectado = fakeLive(direct());
    conectado.live.offer = { attempt: 'a', sdp: 'x' };
    answerOffer(conectado.live);
    expect(conectado.live.offer).toBeDefined();
  });

  it('lo que llega por el servidor sin respaldo abierto espera, con tope; un give-up fuera de tiempo no hace nada', () => {
    const { live, events } = fakeLive(waiting);
    for (let i = 0; i < 25; i++) onRelay(live, [{ t: 'patch', p: [] }]);
    expect(live.relayInbox).toHaveLength(20);
    onRelay(live, [{ t: 'give-up' }]);
    expect(events).toEqual([]);
  });

  it('un directo reemplazado antes de abrir no avisa nada; si no se pudo mandar la señal, se anota', async () => {
    directSettings.openWithinMs = 300;
    try {
      const { live, notes, events } = fakeLive(waiting, (async () => ({
        ok: false,
        error: 'peer-absent',
      })) as never);
      openDirect(live, 'a', false);
      await vi.waitFor(() => expect(live.opening?.attempt).toBe('a'));
      openDirect(live, 'b', false);
      await vi.waitFor(() => expect(events).toEqual([{ type: 'directFailed', attempt: 'b' }]));
      expect(notes).toContain('signal-failed');
    } finally {
      directSettings.openWithinMs = 5000;
    }
  });

  it('si el otro corta el directo dormido, se avisa a la máquina', () => {
    const { live, events } = fakeLive(direct());
    const { link } = fakeLink(live);
    live.current = link;
    closeTransport(live, true);
    link.transport.close('lost');
    expect(live.dormant).toBeUndefined();
    expect(events).toEqual([{ type: 'dormantLost' }]);
  });

  it('el dormido se reemplaza por otro, cerrar todo lo cierra, y sin conexión del intento no hay qué promover', () => {
    const { live } = fakeLive(direct());
    live.current = fakeLink(live, 'a').link;
    closeTransport(live, true);
    live.current = fakeLink(live, 'b').link;
    closeTransport(live, true);
    expect(live.dormant?.attempt).toBe('b');
    closeTransport(live, false);
    expect(live.dormant).toBeUndefined();
    expect(promote(live, 'z')).toBeUndefined();
  });
});

describe('el espejo con el otro', () => {
  it('sin conexión no hay espejo, ni saludo, ni foto', async () => {
    const { live, notes } = fakeLive(direct());
    attachMirror(live, 'direct');
    expect(notes).toContain('no-link');
    attachMirror(fakeLive(waiting).live, 'relayed');
    expect(() => sendHello(live, undefined)).not.toThrow();
    await sendSnapshot(live, true);
    expect(live.deps.mirror.port()).toBeUndefined();
  });

  it('por el directo sin la huella del otro, confirma con una vacía: el servidor dice que no y nada sale', async () => {
    const { live } = fakeLive(direct());
    const check = vi.fn(async () => ({
      ok: true as const,
      data: { pairing: pc, peer: 'gone' as const },
    }));
    live.confirm = createConfirm({ check, onVerdict: vi.fn() });
    const { link, sent } = fakeLink(live);
    live.current = link;
    attachMirror(live, 'direct');
    expect(sent).toEqual([expect.objectContaining({ t: 'hello' })]);
    live.deps.mirror.register('k', 'a', z.string()).set('b');
    await vi.waitFor(() => expect(check).toHaveBeenCalledWith(''));
    await new Promise((settled) => setTimeout(settled, 0));
    expect(sent).toHaveLength(1);
  });

  it('sin el saludo del otro, la foto sale igual a los 5 s; lo que no entra en un mensaje se anota', async () => {
    vi.useFakeTimers();
    const { live, notes } = fakeLive(direct());
    const { link, sent } = fakeLink(live);
    live.current = link;
    live.deps.mirror.register('grande', 'x'.repeat(70 * 1024), z.string());
    const photo = sendSnapshot(live, false);
    await vi.advanceTimersByTimeAsync(runtimeSettings.helloWaitMs);
    await photo;
    expect(notes).toEqual(['hello-timeout', 'too-large']);
    expect(sent).toEqual([]);
  });

  it('si cambió la conexión mientras esperaba el saludo, no manda la foto', async () => {
    vi.useFakeTimers();
    const { live } = fakeLive(direct());
    const first = fakeLink(live);
    live.current = first.link;
    const photo = sendSnapshot(live, false);
    live.current = fakeLink(live, 'b').link;
    await vi.advanceTimersByTimeAsync(runtimeSettings.helloWaitMs);
    await photo;
    expect(first.sent).toEqual([]);
  });

  it('una parte de la foto sola no se aplica todavía', () => {
    const { live } = fakeLive(direct());
    const { link, deliver } = fakeLink(live);
    live.current = link;
    const adopt = vi.spyOn(live.deps.mirror, 'adopt');
    deliver(JSON.stringify({ t: 'snap', p: [], part: 0, of: 2 }));
    expect(adopt).not.toHaveBeenCalled();
  });
});

describe('el tema y los comandos', () => {
  it('sin vínculo no hay tema que pedir', () => {
    const { live } = fakeLive({ kind: 'unpaired' });
    subscribe(live, true);
    expect(live.deps.want).not.toHaveBeenCalled();
  });

  it('el adiós solo dice los motivos del protocolo; el reintento para si ya no está sin internet', async () => {
    const { live } = fakeLive(direct());
    const { link, sent } = fakeLink(live);
    live.current = link;
    runners.bye(live, { do: 'bye', why: 'version' as never });
    expect(sent).toEqual([]);
    const delays = reconnectDelaysMs.splice(0, 5, 1, 1, 1, 1, 1);
    runners.retryInternet(live, { do: 'retryInternet' } as never);
    await new Promise((settled) => setTimeout(settled, 10));
    reconnectDelaysMs.splice(0, 5, ...delays);
    expect(live.check).not.toHaveBeenCalled();
  });
});

describe('sin internet', () => {
  it('reintenta a los 2, 4, 8, 16 y 32 s, y después cada minuto', async () => {
    vi.useFakeTimers();
    const { live } = fakeLive({ kind: 'offline', pairing: pc });
    runners.retryInternet(live, { do: 'retryInternet' } as never);
    await vi.advanceTimersByTimeAsync(2000 + 4000 + 8000 + 16_000 + 32_000);
    expect(live.check).toHaveBeenCalledTimes(5);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(live.check).toHaveBeenCalledTimes(6);
  });
});

describe('el vínculo vivo', () => {
  const pairing = pc as PairingView;
  const base = (api: Deps['api']) =>
    createRuntime({
      api,
      want: () => () => undefined,
      mirror: createMirror(),
      rtc: createWifi().rtc('X'),
      online: createStore(true),
      appVersion: 'v1',
      outdated: () => false,
      journal: { note: notes.push.bind(notes), step: vi.fn() } as never,
      strip: () => undefined,
    });
  const notes: string[] = [];

  it('un error en un paso se anota y la fila sigue; un error del servidor al preguntar no cambia nada', async () => {
    const throwing = (async () => {
      throw new Error('roto');
    }) as never;
    const runtime = base(throwing);
    runtime.dispatch({ type: 'serverSaid', pairing });
    runtime.dispatch({ type: 'peerGone', why: 'lost' });
    runtime.dispatch({ type: 'tabAway', why: 'hidden' });
    runtime.dispatch({ type: 'tabBack' });
    await runtime.settled();
    expect(notes[0]).toBe('error');
    expect(await runtime.roundTripMs()).toBeUndefined();
    const refused = base((async () => ({ ok: false, error: 'not-paired' })) as never);
    await refused.check();
    expect(refused.state.get().kind).toBe('asleep');
    runtime.stop();
    refused.stop();
  });
});

// Las piezas del vínculo vivo, una por una, con un `Live` de mentira: lo que la simulación de dos
// dispositivos no alcanza (bordes de carreras, topes y defensas).
import type { PairingView } from '@ferrebress/shared/contracts/device-link';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMirror } from '../../../platform/mirror/registry.ts';
import { platformSettings } from '../../../platform/settings.ts';
import { createStore } from '../../../platform/store.ts';
import { fakeLink, fakeLive } from '../../../testing/live.ts';
import { pc } from '../../../testing/pairing.ts';
import { createWifi } from '../../../testing/wifi.ts';
import type { PairingState } from '../machine/types.ts';
import { createRuntime, type Deps } from '../runtime.ts';
import { deviceLinkSettings } from '../settings.ts';
import { runners } from './commands.ts';
import { answerOffer, closeTransport, onRelay, onSignal, openDirect, promote } from './links.ts';
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

  it('lo que llega por el servidor presentándose espera, con tope; fuera de eso no se guarda (4.5)', () => {
    const { live, events } = fakeLive({ kind: 'meeting', pairing: pc, attempt: 'a' });
    for (let i = 0; i < 25; i++) onRelay(live, [{ t: 'patch', p: [] }]);
    expect(live.relayInbox).toHaveLength(20);
    closeTransport(live, true);
    expect(live.relayInbox).toEqual([]);
    const late = fakeLive(waiting);
    onRelay(late.live, [{ t: 'patch', p: [] }]);
    expect(late.live.relayInbox).toEqual([]);
    // Un give-up fuera de la presentación no hace nada.
    onRelay(late.live, [{ t: 'give-up' }]);
    expect(late.events).toEqual([]);
    expect(events).toEqual([]);
  });

  it('un directo reemplazado antes de abrir no avisa nada; si no se pudo mandar la señal, se anota', async () => {
    platformSettings.direct.openWithinMs = 300;
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
      platformSettings.direct.openWithinMs = 5000;
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

describe('el tema y los comandos', () => {
  it('el celular que se fijó deja el tema al rato solo si sigue solo', async () => {
    vi.useFakeTimers();
    const { live, events } = fakeLive(waiting);
    let handler: { onEvent(data: unknown): void } | undefined;
    live.deps.want = vi.fn((_token, h) => {
      handler = h;
      return vi.fn();
    });
    subscribe(live, true);
    handler?.onEvent({ present: false });
    handler?.onEvent({ present: true, attempt: 'a' });
    await vi.advanceTimersByTimeAsync(deviceLinkSettings.runtime.peekMs);
    expect(live.topic).toBeDefined();
    expect(events).toEqual([{ type: 'peerPresent', attempt: 'a' }]);
  });

  it('sin vínculo no hay tema que pedir', () => {
    const { live } = fakeLive({ kind: 'unpaired' });
    subscribe(live, true);
    expect(live.deps.want).not.toHaveBeenCalled();
  });

  it('un error al armar la foto se anota: no frena la fila', async () => {
    const { live, notes } = fakeLive(direct());
    live.current = fakeLink(live).link;
    live.hello = { t: 'hello', v: 1, app: 'v1' };
    vi.spyOn(live.confirm, 'ensure').mockRejectedValue(new Error('roto'));
    runners.snapshot(live, { do: 'snapshot', withQueries: false });
    await vi.waitFor(() => expect(notes).toContain('error'));
  });

  it('el adiós solo dice los motivos del protocolo; el reintento para si ya no está sin internet', async () => {
    const { live } = fakeLive(direct());
    const { link, sent } = fakeLink(live);
    live.current = link;
    runners.bye(live, { do: 'bye', why: 'version' as never });
    expect(sent).toEqual([]);
    const delays = platformSettings.reconnect.delaysMs.splice(0, 5, 1, 1, 1, 1, 1);
    runners.retryInternet(live, { do: 'retryInternet' } as never);
    await new Promise((settled) => setTimeout(settled, 10));
    platformSettings.reconnect.delaysMs.splice(0, 5, ...delays);
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

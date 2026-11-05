// Los transportes (diseño de 03, § 4): lo común (el tope, cerrar una vez, lo que no es JSON), el
// directo con un WebRTC de mentira (ofrecer, responder, abrir a tiempo o no, cortarse) y el respaldo
// por el servidor (juntar lo de 50 ms, recibir, cerrar si el servidor no acepta).
import { filterCandidates, fingerprintOf } from '@ferrebress/shared/peer/candidates';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeRtc } from '../../testing/fake-rtc.ts';
import { platformSettings } from '../settings.ts';
import { createDirect } from './direct.ts';
import { createRelayed } from './relayed.ts';
import { createTransport, maxMessageBytes } from './transport.ts';

afterEach(() => vi.useRealTimers());

const sdp = [
  'v=0',
  'a=fingerprint:sha-256 AA:BB',
  'a=candidate:1 1 udp 1 abc.local 5000 typ host',
  'a=candidate:2 1 udp 1 2800:810::1 5001 typ host',
  'a=candidate:3 1 tcp 1 192.168.0.2 9 typ host',
].join('\r\n');

describe('lo común de un transporte', () => {
  it('rechaza lo de más de 64 KB, no escribe cerrado, cierra una vez y no entrega lo que no es JSON', () => {
    const written: string[] = [];
    const shut = vi.fn();
    const { transport, deliver } = createTransport('direct', (t) => written.push(t), shut);
    const got = vi.fn();
    const stopGot = transport.onMessage(got);
    const reasons: string[] = [];
    const stopClose = transport.onClose((why) => reasons.push(why));
    expect(transport.send({ a: 1 })).toBe(true);
    expect(transport.send('x'.repeat(maxMessageBytes))).toBe(false);
    deliver('{"b":2}');
    deliver('no es json');
    expect(got).toHaveBeenCalledTimes(1);
    stopGot();
    transport.close('closed');
    transport.close('lost');
    deliver('{"b":3}');
    expect(transport.send({ a: 2 })).toBe(false);
    expect(written).toEqual(['{"a":1}']);
    expect(reasons).toEqual(['closed']);
    expect(shut).toHaveBeenCalledTimes(1);
    stopClose();
  });

  it('el filtro deja solo las direcciones del Wi-Fi en UDP, y la huella sale de la descripción', () => {
    const kept = filterCandidates(sdp);
    expect(kept).toContain('abc.local');
    expect(kept).not.toContain('2800:810');
    expect(kept).not.toContain('tcp');
    expect(fingerprintOf(sdp)).toBe('sha-256 AA:BB');
    expect(fingerprintOf('v=0')).toBeUndefined();
  });
});

describe('directo', () => {
  it('la computadora ofrece filtrado; abre, viajan mensajes y se corta si ICE falla', async () => {
    const pc = fakeRtc(sdp);
    const signals: string[] = [];
    const direct = createDirect({
      connection: pc.connection,
      signal: async (kind, text) =>
        void signals.push(`${kind}:${text.includes('2800') ? 'mal' : 'bien'}`),
    });
    const offered = direct.offer();
    await Promise.resolve();
    await Promise.resolve();
    pc.channel.open();
    expect(await offered).toBe(true);
    expect(signals).toEqual(['offer:bien']);
    const got = vi.fn();
    direct.transport.onMessage(got);
    pc.channel.receive('{"t":"hello"}');
    expect(got).toHaveBeenCalledWith({ t: 'hello' });
    direct.transport.send({ t: 'snap' });
    expect(pc.channel.sent).toEqual(['{"t":"snap"}']);
    expect(direct.fingerprint()).toBe('sha-256 AA:BB');
    expect(await direct.roundTripMs()).toBe(8);
    await direct.accept('respuesta');
    const reasons: string[] = [];
    direct.transport.onClose((why) => reasons.push(why));
    expect(direct.ice()).toBe('new');
    pc.state('failed');
    expect(direct.ice()).toBe('failed');
    expect(reasons).toEqual(['lost']);
    expect(pc.closed()).toBe(1);
  });

  it('si el canal no abre en 5 s, falla; cortado más de 5 s, se pierde; reconectado antes, sigue', async () => {
    vi.useFakeTimers();
    const pc = fakeRtc(sdp);
    const direct = createDirect({ connection: pc.connection, signal: async () => undefined });
    const offered = direct.offer();
    await vi.advanceTimersByTimeAsync(platformSettings.direct.openWithinMs);
    expect(await offered).toBe(false);
    const phone = fakeRtc(sdp);
    const answering = createDirect({ connection: phone.connection, signal: async () => undefined });
    const answered = answering.answer('oferta');
    await vi.advanceTimersByTimeAsync(0);
    phone.channel.open();
    expect(await answered).toBe(true);
    const reasons: string[] = [];
    answering.transport.onClose((why) => reasons.push(why));
    phone.state('disconnected');
    phone.state('connected');
    await vi.advanceTimersByTimeAsync(platformSettings.direct.lostAfterMs);
    expect(reasons).toEqual([]);
    phone.state('disconnected');
    await vi.advanceTimersByTimeAsync(platformSettings.direct.lostAfterMs);
    expect(reasons).toEqual(['lost']);
    phone.channel.close();
  });
});

describe('por el servidor', () => {
  it('junta lo de 50 ms en un lote, recibe del canal, y si el servidor no acepta se cierra', async () => {
    vi.useFakeTimers();
    const batches: unknown[][] = [];
    let receive: (batch: unknown[]) => void = () => undefined;
    let accepts = true;
    const unsubscribed = vi.fn();
    const relayed = createRelayed({
      send: async (batch) => {
        batches.push(batch);
        return accepts;
      },
      subscribe: (r) => {
        receive = r as never;
        return unsubscribed;
      },
    });
    relayed.transport.send({ a: 1 });
    relayed.transport.send({ a: 2 });
    await vi.advanceTimersByTimeAsync(platformSettings.relayed.batchMs);
    expect(batches).toEqual([[{ a: 1 }, { a: 2 }]]);
    expect(relayed.roundTripMs()).toBe(0);
    const got = vi.fn();
    relayed.transport.onMessage(got);
    receive([{ b: 1 }, { b: 2 }]);
    expect(got).toHaveBeenCalledTimes(2);
    accepts = false;
    const reasons: string[] = [];
    relayed.transport.onClose((why) => reasons.push(why));
    relayed.transport.send({ a: 3 });
    await vi.advanceTimersByTimeAsync(platformSettings.relayed.batchMs);
    expect(reasons).toEqual(['lost']);
    expect(unsubscribed).toHaveBeenCalled();
  });

  it('al cerrarlo, lo que quedaba por mandar sale igual', () => {
    const batches: unknown[][] = [];
    const relayed = createRelayed({
      send: async (batch) => Boolean(batches.push(batch)),
      subscribe: () => () => undefined,
    });
    relayed.transport.send({ t: 'bye' });
    relayed.transport.close('closed');
    expect(batches).toEqual([[{ t: 'bye' }]]);
  });
});

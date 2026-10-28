import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ChannelEvent, openChannel } from './realtime.ts';

const sse = (text: string, status = 200) =>
  new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text));
        controller.close();
      },
    }),
    { status },
  );

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('el canal temporal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('entrega los avisos que llegan, aunque vengan partidos', async () => {
    const events: ChannelEvent[] = [];
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: code\ndata: {"code":"ab'));
        controller.enqueue(
          new TextEncoder().encode('c"}\n\nevent: read\ndata: {}\n\n: keep-alive\n\n'),
        );
      },
    });
    const close = openChannel({
      open: async () => new Response(body),
      onEvent: (event) => events.push(event),
    });
    await flush();
    expect(events).toEqual([
      { type: 'code', data: { code: 'abc' } },
      { type: 'read', data: {} },
    ]);
    close();
  });

  it('si se corta, vuelve a abrir como mucho tres veces con espera creciente, y después espera la red', async () => {
    const waits: number[] = [];
    const open = vi.fn(async () => sse('', 500));
    const close = openChannel({
      open,
      onEvent: () => {},
      wait: async (ms) => void waits.push(ms),
    });
    await flush();
    expect(open).toHaveBeenCalledTimes(4);
    expect(waits).toEqual([1000, 2000, 4000]);
    dispatchEvent(new Event('online'));
    await flush();
    expect(open).toHaveBeenCalledTimes(8);
    close();
    dispatchEvent(new Event('online'));
    await flush();
    expect(open).toHaveBeenCalledTimes(8);
  });

  it('frenado por las recargas seguidas, espera lo que dice el servidor y vuelve a abrir', async () => {
    const waits: number[] = [];
    const tooMany = (body: string) =>
      new Response(body, { status: 429, headers: { 'Content-Type': 'application/json' } });
    const open = vi
      .fn()
      .mockResolvedValueOnce(tooMany('{"error":"too-many-attempts","retryAfterSeconds":42}'))
      .mockResolvedValueOnce(tooMany('sin JSON'))
      .mockResolvedValue(sse('event: code\ndata: {}\n\n'));
    const events: ChannelEvent[] = [];
    const close = openChannel({
      open,
      onEvent: (event) => events.push(event),
      wait: async (ms) => {
        waits.push(ms);
        if (waits.length > 2) close();
      },
    });
    await flush();
    expect(waits.slice(0, 2)).toEqual([42_000, 60_000]);
    expect(events[0]).toEqual({ type: 'code', data: {} });
  });

  it('con la pestaña escondida no vuelve a abrir hasta que se vea', async () => {
    let visibility = 'hidden';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility as DocumentVisibilityState,
    );
    const open = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const close = openChannel({ open, onEvent: () => {} });
    await flush();
    expect(open).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(open).toHaveBeenCalledTimes(1);
    visibility = 'visible';
    vi.stubGlobal('navigator', { ...navigator, onLine: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(open.mock.calls.length).toBeGreaterThan(1);
    close();
    vi.restoreAllMocks();
  });

  it('cerrar mientras abre no vuelve a abrir', async () => {
    let release = () => {};
    const open = vi.fn(
      (signal: AbortSignal) =>
        new Promise<Response>((_, reject) => {
          release = () => reject(new Error('cortado'));
          signal.addEventListener('abort', () => release());
        }),
    );
    const close = openChannel({ open, onEvent: () => {}, wait: async () => {} });
    close();
    await flush();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('con la espera de verdad también vuelve a abrir', async () => {
    vi.useFakeTimers();
    const open = vi.fn(async () => sse('', 500));
    const close = openChannel({ open, onEvent: () => {} });
    await vi.advanceTimersByTimeAsync(1000);
    expect(open.mock.calls.length).toBeGreaterThanOrEqual(2);
    close();
    vi.useRealTimers();
  });

  it('si el servidor cierra el canal después de mandar algo, lo vuelve a abrir', async () => {
    const events: ChannelEvent[] = [];
    const open = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(sse('event: code\ndata: {"code":"x"}\n\n'))
      .mockReturnValue(new Promise(() => {}));
    const waits: number[] = [];
    const close = openChannel({
      open,
      onEvent: (event) => events.push(event),
      wait: async (ms) => void waits.push(ms),
    });
    await flush();
    expect(open).toHaveBeenCalledTimes(2);
    expect(waits).toEqual([1000]);
    expect(events[0]).toEqual({ type: 'code', data: { code: 'x' } });
    close();
  });
});

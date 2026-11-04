// El canal de la pestaña (diseño de 03, § 3.2): se abre con lo pedido, suma y saca temas sin
// rehacerse, reparte cada evento a su tema, avisa rechazos y bajas, y se cierra sin pedidos o sin vista.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRealtimeChannel } from './channel.ts';

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

// Un servidor de mentira: cada apertura deja un SSE que la prueba alimenta, y cada cambio de
// suscripciones contesta lo que diga la prueba.
function fakeServer() {
  const opens: {
    url: string;
    send: (event: string, data: unknown) => void;
    aborted: () => boolean;
  }[] = [];
  let changeReply: () => Response = () => Response.json({ listening: [] });
  const changes: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      changes.push(JSON.parse(init.body as string));
      return changeReply();
    }),
  );
  const fetcher = vi.fn(async (url: string, init: RequestInit) => {
    const source = Promise.withResolvers<ReadableStreamDefaultController<Uint8Array>>();
    const body = new ReadableStream<Uint8Array>({ start: (c) => source.resolve(c) });
    const controller = await source.promise;
    const signal = init.signal as AbortSignal;
    opens.push({
      url,
      send: (event, data) =>
        controller.enqueue(
          new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        ),
      aborted: () => signal.aborted,
    });
    return new Response(body);
  }) as unknown as typeof fetch;
  return { opens, changes, fetcher, reply: (r: () => Response) => (changeReply = r) };
}

const handler = () => ({ onEvent: vi.fn(), onRefused: vi.fn(), onDropped: vi.fn() });

describe('el canal de la pestaña', () => {
  let server: ReturnType<typeof fakeServer>;
  beforeEach(() => {
    server = fakeServer();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('se abre con los temas pedidos, reparte por tema y se cierra cuando no queda nada', async () => {
    const channel = createRealtimeChannel(server.fetcher);
    const news = handler();
    const release = channel.want('test.news:3', news);
    await settle();
    expect(server.opens[0]?.url).toBe('/api/realtime?s=test.news%3A3');
    server.opens[0]?.send('hello', { channel: 'c'.repeat(22) });
    server.opens[0]?.send('test.news', { count: 3 });
    server.opens[0]?.send('test.other', { x: 1 });
    await settle();
    expect(news.onEvent).toHaveBeenCalledWith({ count: 3 });
    expect(news.onEvent).toHaveBeenCalledTimes(1);
    expect(channel.isOpen()).toBe(true);
    release();
    await settle();
    expect(channel.isOpen()).toBe(false);
    expect(server.opens[0]?.aborted()).toBe(true);
  });

  it('sumar y sacar temas no rehace el canal: se lo dice al servidor', async () => {
    const channel = createRealtimeChannel(server.fetcher);
    channel.want('test.news', handler());
    await settle();
    server.opens[0]?.send('hello', { channel: 'c'.repeat(22) });
    await settle();
    server.reply(() => Response.json({ listening: ['test.news', 'test.screen:p'] }));
    const releaseScreen = channel.want('test.screen:p', handler());
    await settle();
    expect(server.changes.at(-1)).toEqual({
      channel: 'c'.repeat(22),
      add: ['test.screen:p'],
      remove: [],
    });
    server.reply(() => Response.json({ listening: ['test.news'] }));
    releaseScreen();
    await settle();
    expect(server.changes.at(-1)).toEqual({
      channel: 'c'.repeat(22),
      add: [],
      remove: ['test.screen:p'],
    });
    expect(server.opens).toHaveLength(1);
  });

  it('avisa los rechazos y las bajas de un tema, y espera el saludo después de un cierre', async () => {
    const channel = createRealtimeChannel(server.fetcher);
    const news = handler();
    channel.want('test.news', news);
    await settle();
    const opened = server.opens[0];
    opened?.send('hello', { channel: 'c'.repeat(22) });
    opened?.send('refused', { topic: 'test.news', code: 'not-authorized' });
    opened?.send('dropped', { topic: 'test.news' });
    opened?.send('closed', { reason: 'slow' });
    await settle();
    expect(news.onRefused).toHaveBeenCalledWith('not-authorized');
    expect(news.onDropped).toHaveBeenCalled();
    channel.want('test.screen:p', handler());
    await settle();
    expect(server.changes).toHaveLength(0);
  });

  it('si el servidor no lo acepta avisa a todos y no insiste', async () => {
    const refusing = vi.fn(
      async () => new Response('{}', { status: 401 }),
    ) as unknown as typeof fetch;
    const channel = createRealtimeChannel(refusing);
    const news = handler();
    channel.want('test.news', news);
    channel.want('test.news', handler());
    await settle();
    expect(news.onRefused).toHaveBeenCalledWith('401');
    expect(channel.isOpen()).toBe(false);
  });

  it('si el servidor ya no tiene el canal, lo vuelve a abrir; otro error no lo toca', async () => {
    const channel = createRealtimeChannel(server.fetcher);
    channel.want('test.news', handler());
    await settle();
    server.opens[0]?.send('hello', { channel: 'c'.repeat(22) });
    await settle();
    server.reply(() => Response.json({ error: 'too-many-attempts' }, { status: 429 }));
    channel.want('test.a', handler());
    await settle();
    expect(server.opens).toHaveLength(1);
    server.reply(() => Response.json({ error: 'not-found' }, { status: 404 }));
    channel.want('test.b', handler());
    await settle();
    expect(server.opens).toHaveLength(2);
    expect(server.opens[1]?.url).toBe('/api/realtime?s=test.news&s=test.a&s=test.b');
  });

  it('con la pestaña oculta se cierra en el acto, y al volver a la vista se abre', async () => {
    const channel = createRealtimeChannel(server.fetcher);
    channel.want('test.news', handler());
    await settle();
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    expect(channel.isOpen()).toBe(false);
    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    expect(channel.isOpen()).toBe(true);
    expect(server.opens).toHaveLength(2);
  });

  it('dos pantallas que piden el mismo tema cuentan como una, y soltar una no lo suelta', async () => {
    const channel = createRealtimeChannel(server.fetcher);
    const [a, b] = [handler(), handler()];
    const releaseA = channel.want('test.news', a);
    const releaseB = channel.want('test.news', b);
    await settle();
    expect(server.opens[0]?.url).toBe('/api/realtime?s=test.news');
    releaseA();
    await settle();
    expect(channel.isOpen()).toBe(true);
    server.opens[0]?.send('hello', { channel: 'c'.repeat(22) });
    server.opens[0]?.send('test.news', 1);
    await settle();
    expect(a.onEvent).not.toHaveBeenCalled();
    expect(b.onEvent).toHaveBeenCalledWith(1);
    releaseB();
  });

  it('quien no escucha rechazos ni bajas no se entera, y un tema que nadie pidió no rompe nada', async () => {
    const channel = createRealtimeChannel(server.fetcher);
    const onEvent = vi.fn();
    channel.want('test.news', { onEvent });
    await settle();
    const opened = server.opens[0];
    opened?.send('hello', { channel: 'c'.repeat(22) });
    opened?.send('refused', { topic: 'test.news', code: 'x' });
    opened?.send('dropped', { topic: 'test.news' });
    opened?.send('refused', { topic: 'test.nadie', code: 'x' });
    await settle();
    expect(onEvent).not.toHaveBeenCalled();
    const refusing = vi.fn(
      async () => new Response('{}', { status: 403 }),
    ) as unknown as typeof fetch;
    createRealtimeChannel(refusing).want('test.news', { onEvent });
    await settle();
  });

  it('si mientras cambia los temas se cerró el canal, la respuesta no toca nada', async () => {
    const channel = createRealtimeChannel(server.fetcher);
    const release = channel.want('test.news', handler());
    await settle();
    server.opens[0]?.send('hello', { channel: 'c'.repeat(22) });
    await settle();
    let reply!: () => void;
    server.reply(() => Response.json({ listening: ['test.news', 'test.a'] }));
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          reply = () => resolve(Response.json({ listening: ['test.news', 'test.a'] }));
        }),
    );
    const releaseA = channel.want('test.a', handler());
    await settle();
    release();
    releaseA();
    await settle();
    reply();
    await settle();
    expect(channel.isOpen()).toBe(false);
  });
});

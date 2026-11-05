// El canal y el medidor (diseño de 05, § 8.1): cada evento cuenta para su tema; el latido y lo del
// canal mismo, para el único tema que lo tiene abierto. Y un rechazo del canal entero llega a los
// temas con el código que dijo el servidor.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMeter } from '../meter.ts';
import { platformSettings } from '../settings.ts';
import { createRealtimeChannel } from './channel.ts';

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));
const handler = () => ({ onEvent: vi.fn(), onRefused: vi.fn(), onDropped: vi.fn() });

// Un SSE que la prueba alimenta; los cambios de temas contestan que escucha lo pedido.
function fakeStream() {
  const source = Promise.withResolvers<ReadableStreamDefaultController<Uint8Array>>();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) =>
      Response.json({ listening: JSON.parse(init.body as string).add }),
    ),
  );
  const fetcher = vi.fn(
    async () => new Response(new ReadableStream<Uint8Array>({ start: (c) => source.resolve(c) })),
  ) as unknown as typeof fetch;
  const write = async (text: string) => {
    (await source.promise).enqueue(new TextEncoder().encode(text));
    await settle();
  };
  return { fetcher, write };
}

describe('el canal y el medidor', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('cada evento a su tema, y el latido al único tema que tiene abierto el canal', async () => {
    const meter = createMeter();
    const { fetcher, write } = fakeStream();
    const channel = createRealtimeChannel(fetcher, meter);
    const overhead = platformSettings.meter.overheadBytes;
    const release = channel.want('test.news', handler());
    await settle();
    const hello = `event: hello\ndata: {"channel":"${'c'.repeat(22)}"}\n\n`;
    const news = 'event: test.news\ndata: {}\n\n';
    await write(hello);
    await write(':\n\n');
    await write(news);
    const alone = hello.length + 3 + news.length + 3 * overhead;
    expect(meter.rate('test.news')).toBe(alone);
    // Con dos temas, el latido es del total y de ninguno de los dos.
    channel.want('test.other', handler());
    await settle();
    await write(':\n\n');
    expect(meter.rate('test.news')).toBe(alone);
    expect(meter.rate()).toBe(alone + 3 + overhead);
    release();
  });

  it('un rechazo del canal entero llega a los temas con el código del servidor', async () => {
    const refusing = vi.fn(async () =>
      Response.json({ error: 'forbidden' }, { status: 403 }),
    ) as unknown as typeof fetch;
    const channel = createRealtimeChannel(refusing);
    const news = handler();
    channel.want('test.news', news);
    await settle();
    expect(news.onRefused).toHaveBeenCalledWith('forbidden');
  });
});

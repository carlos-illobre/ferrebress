// El canal de una pestaña: lo que escribe, el latido, el oyente lento y el cierre.
import { describe, expect, it } from 'vitest';
import { createChannel, type Owner } from './channel.ts';

const owner: Owner = { kind: 'anonymous', network: '190.1.2.3' };

function fakeSink(write: (text: string) => Promise<unknown> = async () => undefined) {
  const written: string[] = [];
  let closed = 0;
  return {
    written,
    closed: () => closed,
    sink: {
      write: (text: string) => {
        written.push(text);
        return write(text);
      },
      close: () => {
        closed += 1;
      },
    },
  };
}

describe('el canal', () => {
  it('escribe eventos con nombre y datos en JSON, y el latido como comentario', () => {
    const fake = fakeSink();
    const channel = createChannel('a', owner, fake.sink, 1024);
    channel.send('hello', { channel: 'a' });
    channel.beat();
    expect(fake.written).toEqual(['event: hello\ndata: {"channel":"a"}\n\n', ':\n\n']);
  });

  it('un salto de línea en los datos no inventa campos de SSE', () => {
    const fake = fakeSink();
    createChannel('a', owner, fake.sink, 1024).send('x', { text: 'a\n\ndata: b' });
    expect(fake.written[0]).toBe('event: x\ndata: {"text":"a\\n\\ndata: b"}\n\n');
  });

  it('al cerrar avisa el motivo una sola vez y después no escribe más', () => {
    const fake = fakeSink();
    const channel = createChannel('a', owner, fake.sink, 1024);
    const reasons: string[] = [];
    channel.onClose((reason) => reasons.push(reason));
    channel.close('server');
    channel.close('client');
    channel.send('x', 1);
    expect(fake.written).toEqual(['event: closed\ndata: {"reason":"server"}\n\n']);
    expect(reasons).toEqual(['server']);
    expect(fake.closed()).toBe(1);
    expect(channel.isClosed()).toBe(true);
  });

  it('un oyente que no lee se cierra por lento, sin seguir llenando la memoria', () => {
    const fake = fakeSink(() => new Promise(() => undefined));
    const channel = createChannel('a', owner, fake.sink, 40);
    const reasons: string[] = [];
    channel.onClose((reason) => reasons.push(reason));
    channel.send('x', 'bastante texto');
    channel.send('x', 'bastante texto');
    expect(reasons).toEqual(['slow']);
    expect(fake.written).toHaveLength(1);
  });

  it('lo escrito descuenta lo pendiente, y una escritura que falla cierra el canal', async () => {
    const fake = fakeSink();
    const channel = createChannel('a', owner, fake.sink, 40);
    channel.send('x', 'bastante texto');
    await Promise.resolve();
    channel.send('x', 'bastante texto');
    expect(channel.isClosed()).toBe(false);
    const failing = createChannel('b', owner, fakeSink(() => Promise.reject()).sink, 40);
    const reasons: string[] = [];
    failing.onClose((reason) => reasons.push(reason));
    failing.beat();
    await new Promise((resolve) => setTimeout(resolve));
    expect(reasons).toEqual(['client']);
    // Cerrado por el servidor antes de que falle lo que estaba escribiendo: un solo aviso.
    const closing = createChannel('c', owner, fakeSink(() => Promise.reject()).sink, 400);
    const once: string[] = [];
    closing.onClose((reason) => once.push(reason));
    closing.close('server');
    await new Promise((resolve) => setTimeout(resolve));
    expect(once).toEqual(['server']);
  });
});

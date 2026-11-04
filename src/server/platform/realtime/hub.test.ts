// La central sin las rutas: los bordes que una pestaña de verdad no alcanza.
import { describe, expect, it } from 'vitest';
import * as z from 'zod/mini';
import { createChannel, type Owner } from './channel.ts';
import { createHub, parseToken } from './hub.ts';
import { createTopics } from './topics.ts';

const session: Owner = {
  kind: 'session',
  session: {
    id: 's',
    userId: 'u',
    deviceId: 'd',
    deviceLabel: 'Chrome en Windows',
    isPhone: false,
    confirmedAt: null,
  },
};

function setup() {
  const topics = createTopics();
  let allow = true;
  topics.define({
    name: 'test.a',
    param: z.string(),
    event: z.number(),
    authorize: () => (allow ? { key: 'k' } : { key: 'otra' }),
  });
  topics.define({
    name: 'test.b',
    param: z.string(),
    event: z.number(),
    authorize: () => ({ key: 'k' }),
  });
  const hub = createHub(topics);
  const written: string[] = [];
  const channel = createChannel(
    'c',
    session,
    { write: async (t) => written.push(t), close: () => undefined },
    1e6,
  );
  hub.open(channel);
  return { hub, channel, written, deny: () => (allow = false) };
}

describe('la central', () => {
  it('separa el tema de su parámetro', () => {
    expect(parseToken('a.b')).toEqual({ topic: 'a.b', raw: '' });
    expect(parseToken('a.b:x:y')).toEqual({ topic: 'a.b', raw: 'x:y' });
  });

  it('una clave nueva al volver a preguntar también suelta la suscripción', async () => {
    const { hub, channel, written, deny } = setup();
    for (const token of ['test.a', 'test.b']) {
      const granted = await hub.authorize(session, {}, token);
      if (!('refused' in granted)) await hub.attach(channel, token, granted);
    }
    deny();
    await hub.recheck('test.a');
    await hub.recheck('test.nada');
    expect(written.at(-1)).toContain('"code":"not-authorized"');
    expect([...channel.subscriptions.keys()]).toEqual(['test.b']);
  });

  it('no suma temas a un canal cerrado, ni dos veces el mismo; cerrar por sesión no toca a otra', async () => {
    const { hub, channel } = setup();
    const granted = await hub.authorize(session, {}, 'test.a');
    if ('refused' in granted) throw new Error('debía pasar');
    await hub.attach(channel, 'test.a', granted);
    await hub.attach(channel, 'test.a', granted);
    expect(hub.listeners('test.a', 'k')).toBe(1);
    hub.closeSession('otra');
    expect(channel.isClosed()).toBe(false);
    hub.closeSession('s');
    await hub.attach(channel, 'test.b', granted);
    expect(channel.subscriptions.size).toBe(0);
    expect(hub.channels.size).toBe(0);
  });
});

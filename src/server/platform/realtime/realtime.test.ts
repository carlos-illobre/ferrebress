// El canal en tiempo real de punta a punta en el servidor (diseño de 03, § 3): abrir con temas, el
// estado al suscribirse, publicar por clave, sumar y sacar temas, los rechazos, soltar una clave,
// volver a mirar los permisos, el latido y el fin de la sesión.
import { beforeEach, describe, expect, it } from 'vitest';
import * as z from 'zod/mini';
import { createRealtimeServer } from '../../testing/realtime.ts';

declare module '../events.ts' {
  interface ServerEvents {
    'test.permissions-changed': Record<string, never>;
  }
}

let server: ReturnType<typeof createRealtimeServer>;
let allowed = true;
const unsubscribed: string[] = [];

beforeEach(() => {
  server = createRealtimeServer();
  allowed = true;
  unsubscribed.length = 0;
  // Un tema con sesión: la clave es la persona; al suscribirse manda cuántas hay.
  server.realtime.topic({
    name: 'test.news',
    param: z.string().check(z.regex(/^\d*$/)),
    event: z.object({ count: z.number() }),
    authorize: ({ session }) =>
      allowed ? { key: session?.userId as string } : { refused: 'not-authorized' },
    onSubscribe: (_key, send, param) => send({ count: Number(param || 0) }),
    onUnsubscribe: (key) => void unsubscribed.push(key),
    recheckOn: ['test.permissions-changed'],
  });
  // Un tema sin sesión (como la entrada): la clave es el parámetro.
  server.realtime.topic({
    name: 'test.screen',
    param: z.string(),
    event: z.object({ code: z.string() }),
    authorize: (_listener, param) => ({ key: param }),
    anonymous: true,
  });
});

// Como una transacción que publica el cambio de permisos: lo de después corre al confirmarla.
const permissionsChanged = async () => {
  for (const then of await server.events.publish('test.permissions-changed', {}, {} as never))
    then();
};

const signedIn = (id = 's1') => {
  server.signIn(id);
  return server.tab({ 'X-Test-Session': id });
};

describe('abrir el canal', () => {
  it('saluda con el canal y manda el estado de ahora de cada tema', async () => {
    const tab = signedIn();
    const response = await tab.open('s=test.news:3');
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');
    expect(tab.received.map((r) => r.event)).toEqual(['hello', 'test.news']);
    expect(tab.channel()).toHaveLength(22);
    expect(tab.received[1]?.data).toEqual({ count: 3 });
    await tab.close();
  });

  it('un tema rechazado no impide los otros; si no pasa ninguno no se abre nada', async () => {
    const tab = signedIn();
    await tab.open('s=test.news&s=test.nada&s=test.news:x');
    expect(tab.received.filter((r) => r.event === 'refused').map((r) => r.data)).toEqual([
      { topic: 'test.nada', code: 'not-found' },
      { topic: 'test.news:x', code: 'bad-request' },
    ]);
    await tab.close();
    expect(unsubscribed).toEqual(['u-s1']);
    expect((await signedIn().open('s=test.nada')).status).toBe(403);
    allowed = false;
    const refused = await signedIn().open('s=test.news');
    expect(await refused.json()).toEqual({ error: 'not-authorized' });
  });

  it('sin sesión solo los temas anónimos', async () => {
    const tab = server.tab();
    expect((await tab.open('s=test.news')).status).toBe(401);
    await tab.open('s=test.screen:p1');
    server.realtime.publish('test.screen', 'p1', { code: 'abc' });
    await tab.settle();
    expect(tab.received.at(-1)).toEqual({ event: 'test.screen', data: { code: 'abc' } });
    await tab.close();
  });

  it('sin temas, o con más de dieciséis, es un pedido mal hecho', async () => {
    expect((await signedIn().open('')).status).toBe(400);
    const many = Array.from({ length: 17 }, (_, i) => `s=test.news:${i}`).join('&');
    expect((await signedIn().open(many)).status).toBe(400);
  });

  it('la quinta pestaña de una sesión espera: 429 con cuánto', async () => {
    const tabs = [1, 2, 3, 4].map(() => signedIn());
    for (const tab of tabs) await tab.open('s=test.news');
    const fifth = await signedIn().open('s=test.news');
    expect(fifth.status).toBe(429);
    expect(await fifth.json()).toEqual({ error: 'too-many-attempts', retryAfterSeconds: 40 });
    for (const tab of tabs) await tab.close();
  });
});

describe('publicar', () => {
  it('llega solo a quienes escuchan esa clave, y cuenta a cuántos', async () => {
    const [ana, beto] = [signedIn('ana'), signedIn('beto')];
    await ana.open('s=test.news');
    await beto.open('s=test.news');
    expect(server.realtime.publish('test.news', 'u-ana', { count: 7 })).toBe(1);
    expect(server.realtime.listeners('test.news', 'u-ana')).toBe(1);
    await ana.settle();
    expect(ana.received.at(-1)?.data).toEqual({ count: 7 });
    expect(beto.received.at(-1)?.data).toEqual({ count: 0 });
    await ana.close();
    await beto.close();
  });

  it('lo que no tiene la forma del tema, o un tema que no existe, es un error de programación', async () => {
    const tab = signedIn();
    await tab.open('s=test.news');
    expect(() => server.realtime.publish('test.news', 'u-s1', { count: 'x' })).toThrow('su forma');
    expect(() => server.realtime.publish('test.nada', 'k', {})).toThrow('no está declarado');
    await tab.close();
  });

  it('dos temas con el mismo nombre, o un nombre sin módulo, no se pueden declarar', () => {
    const topic = { param: z.string(), event: z.string(), authorize: () => ({ key: 'k' }) };
    expect(() => server.realtime.topic({ ...topic, name: 'test.news' })).toThrow('ya está');
    expect(() => server.realtime.topic({ ...topic, name: 'suelto' })).toThrow('modulo.nombre');
  });
});

describe('cambiar los temas sin rehacer el canal', () => {
  it('primero saca y después suma: sacar y sumar el mismo tema lo vuelve a escuchar', async () => {
    const tab = signedIn();
    await tab.open('s=test.news');
    const changed = await tab.change({
      channel: tab.channel(),
      add: ['test.news', 'test.screen:p2', 'test.nada'],
      remove: ['test.news', 'test.nunca'],
    });
    expect(await changed.json()).toEqual({ listening: ['test.news', 'test.screen:p2'] });
    await tab.settle();
    expect(tab.received.at(-1)).toEqual({
      event: 'refused',
      data: { topic: 'test.nada', code: 'not-found' },
    });
    expect(unsubscribed).toEqual(['u-s1']);
    await tab.close();
  });

  it('el canal de otro, uno que no existe o un cuerpo mal hecho no se tocan', async () => {
    const ana = signedIn('ana');
    await ana.open('s=test.news');
    const beto = signedIn('beto');
    expect((await beto.change({ channel: ana.channel(), add: [] })).status).toBe(404);
    expect((await ana.change({ channel: 'x'.repeat(22) })).status).toBe(404);
    expect((await ana.change({ channel: 'corto' })).status).toBe(400);
    const anonymous = server.tab();
    await anonymous.open('s=test.screen:p');
    expect((await anonymous.change({ channel: anonymous.channel() })).status).toBe(200);
    expect((await signedIn('ana').change({ channel: anonymous.channel() })).status).toBe(404);
    expect((await server.tab().change({ channel: ana.channel() })).status).toBe(404);
    await ana.close();
    await anonymous.close();
  });

  it('pasar de dieciséis temas no entra, y sesenta cambios por minuto es el tope', async () => {
    const tab = signedIn();
    await tab.open('s=test.news');
    const sixteen = Array.from({ length: 16 }, (_, i) => `test.news:${i}`);
    expect((await tab.change({ channel: tab.channel(), add: sixteen })).status).toBe(400);
    for (let i = 1; i < 60; i++) await tab.change({ channel: tab.channel() });
    expect((await tab.change({ channel: tab.channel() })).status).toBe(429);
    await tab.close();
  });
});

describe('lo que hace el servidor con los canales abiertos', () => {
  it('soltar una clave avisa a quienes la escuchaban y deja de entregarles', async () => {
    const tab = signedIn();
    await tab.open('s=test.news');
    server.realtime.drop('test.news', 'u-s1');
    server.realtime.drop('test.news', 'u-nadie');
    await tab.settle();
    expect(tab.received.at(-1)).toEqual({ event: 'dropped', data: { topic: 'test.news' } });
    expect(server.realtime.publish('test.news', 'u-s1', { count: 1 })).toBe(0);
    await tab.close();
  });

  it('cuando cambian los permisos vuelve a preguntar; el que ya no puede recibe refused', async () => {
    const [ana, anonymous] = [signedIn('ana'), server.tab()];
    await ana.open('s=test.news&s=test.screen:p');
    await anonymous.open('s=test.screen:q');
    await permissionsChanged();
    await ana.settle();
    expect(ana.received.at(-1)?.event).toBe('test.news');
    allowed = false;
    await permissionsChanged();
    await ana.settle();
    expect(ana.received.at(-1)).toEqual({
      event: 'refused',
      data: { topic: 'test.news', code: 'not-authorized' },
    });
    expect(server.realtime.listeners('test.news', 'u-ana')).toBe(0);
    await ana.close();
    await anonymous.close();
  });

  it('el latido llega a cada canal, y cierra los de una sesión que venció sin aviso', async () => {
    const [ana, beto] = [signedIn('ana'), signedIn('beto')];
    await ana.open('s=test.news');
    await beto.open('s=test.news');
    await server.beat();
    await ana.settle();
    expect(ana.beats()).toBe(1);
    server.expire('beto');
    await server.beat();
    await beto.settle();
    expect(beto.received.at(-1)).toEqual({ event: 'closed', data: { reason: 'session-ended' } });
    expect(beto.ended()).toBe(true);
    await ana.close();
  });

  it('cuando sign-in avisa que una sesión terminó, sus canales se cierran', async () => {
    const tab = signedIn('ana');
    await tab.open('s=test.news');
    server.sessions.ended({ id: 'ana', userId: 'u-ana' }, 'revoked');
    await tab.settle();
    expect(tab.received.at(-1)).toEqual({ event: 'closed', data: { reason: 'session-ended' } });
  });
});

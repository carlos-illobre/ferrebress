// Para las pruebas del canal en tiempo real: un servidor con la plataforma mínima (la cabecera, la
// sesión resuelta por una cabecera de prueba, el latido a mano) y una pestaña que abre su canal y junta
// lo que le llega.

import { createEvents } from '../platform/events.ts';
import { createHttp } from '../platform/http.ts';
import { createRateLimiter } from '../platform/limits/rate-limit.ts';
import { createRealtime } from '../platform/realtime/realtime.ts';
import { createSessionGate } from '../platform/session.ts';
import { appHeaders, testConfig } from './config.ts';

export type Received = { event: string; data: unknown };

export function createRealtimeServer() {
  const clock = { now: () => new Date('2026-11-04T10:00:00Z') };
  // Ningún pedido de estas pruebas se rechaza por la cabecera: no se anota nada.
  const audit = {} as never;
  const limiter = createRateLimiter(clock);
  const http = createHttp({
    ...{ environment: 'testing', version: 'test', publicOrigin: testConfig.PUBLIC_ORIGIN },
    ...{ trustedProxy: testConfig.TRUSTED_PROXY, clock, audit, limiter },
  });
  const sessions = createSessionGate();
  const open = new Set<string>();
  // La sesión sale de una cabecera de prueba; sin ella, 401 como en la aplicación.
  sessions.provide(
    async (c) => {
      const id = c.req.header('X-Test-Session');
      if (!id || !open.has(id)) return c.json({ error: 'session-closed' }, 401);
      return {
        id,
        userId: `u-${id}`,
        deviceId: 'd',
        deviceLabel: 'Chrome en Windows',
        isPhone: false,
        confirmedAt: null,
      };
    },
    (id) => open.has(id),
  );
  const events = createEvents();
  const beats: (() => Promise<void>)[] = [];
  const realtime = createRealtime({
    ...{ http, sessions, limiter, events },
    every: (_ms, job) => void beats.push(job),
  });
  return {
    http,
    sessions,
    events,
    realtime,
    signIn: (id: string) => open.add(id),
    expire: (id: string) => open.delete(id),
    beat: () => Promise.all(beats.map((job) => job())),
    tab: (headers: Record<string, string> = {}) => tab(http, headers),
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

function parse(block: string): Received | undefined {
  const event = /^event: (.*)$/m.exec(block)?.[1];
  const data = /^data: (.*)$/m.exec(block)?.[1];
  return event && data ? { event, data: JSON.parse(data) } : undefined;
}

// Lee el SSE hasta que se corta: cada evento a `received`, cada latido a `beat`.
async function collect(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  received: Received[],
  beat: () => void,
): Promise<void> {
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += new TextDecoder().decode(value);
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() as string;
    for (const block of blocks) take(block, received, beat);
  }
}

function take(block: string, received: Received[], beat: () => void): void {
  if (block === ':') beat();
  const parsed = parse(block);
  if (parsed) received.push(parsed);
}

// Una pestaña: abre el canal, junta los eventos (y cuenta los latidos) y lo cierra.
function tab(http: ReturnType<typeof createHttp>, extra: Record<string, string>) {
  const received: Received[] = [];
  const state = { beats: 0, ended: false };
  const controller = new AbortController();
  const headers = { ...appHeaders(), ...extra };
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  return {
    received,
    beats: () => state.beats,
    ended: () => state.ended,
    settle,
    async open(query: string) {
      const response = await http.request(`/api/realtime?${query}`, {
        headers,
        signal: controller.signal,
      });
      if (!response.body || response.status !== 200) return response;
      reader = response.body.getReader();
      void collect(reader, received, () => (state.beats += 1)).then(() => (state.ended = true));
      await settle();
      return response;
    },
    change: (body: object) =>
      http.request('/api/realtime/subscriptions', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          ...headers,
          Origin: testConfig.PUBLIC_ORIGIN,
          'Content-Type': 'application/json',
        },
      }),
    channel: () => {
      const hello = received.find((r) => r.event === 'hello') as Received;
      return (hello.data as { channel: string }).channel;
    },
    // Como la pestaña que se oculta: corta el pedido y deja de leer.
    close: async () => {
      controller.abort();
      await reader?.cancel();
      await settle();
    },
  };
}

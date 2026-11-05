// Las dos rutas del canal (diseño de 03, § 3.2 y § 3.3): abrirlo con los temas que pide la pestaña, y
// sumar o sacar temas sin rehacerlo. El SSE se escribe por un adaptador (`Sink`): el resto del canal
// no sabe de Hono.
import { randomBytes } from 'node:crypto';
import type { Context } from 'hono';
import { type SSEStreamingApi, streamSSE } from 'hono/streaming';
import * as z from 'zod/mini';
import { fail, type Http } from '../http.ts';
import { networkOf } from '../network.ts';
import type { SessionGate } from '../session.ts';
import { type Admission, realtimeSettings } from './admission.ts';
import { type Channel, createChannel, type Owner } from './channel.ts';
import type { Authorized, Hub } from './hub.ts';
import type { Listener } from './topics.ts';

type Deps = { http: Http; hub: Hub; sessions: SessionGate; admission: Admission };

const tokens = z
  .array(z.string().check(z.maxLength(200)))
  .check(z.maxLength(realtimeSettings.maxTopicsPerChannel));
const changeBody = z.object({
  channel: z.string().check(z.length(22)),
  add: z.optional(tokens),
  remove: z.optional(tokens),
});

// Quién abre o cambia el canal: su sesión, o nadie, contado por su red.
async function whoAsks(sessions: SessionGate, c: Context): Promise<[Owner, Listener]> {
  const session = await sessions.identify(c);
  if (session)
    return [
      { kind: 'session', session },
      { session, request: c },
    ];
  return [{ kind: 'anonymous', network: networkOf(c.get('ipAddress') as string) }, { request: c }];
}

const sameOwner = (a: Owner, b: Owner) =>
  a.kind === 'session'
    ? b.kind === 'session' && a.session.id === b.session.id
    : b.kind === 'anonymous' && a.network === b.network;

const tooMany = (c: Context, retryAfterMs: number) =>
  fail(c, 429, 'too-many-attempts', { retryAfterSeconds: Math.ceil(retryAfterMs / 1000) });

// Escucha lo autorizado y avisa por el canal lo que no.
async function attachAll(hub: Hub, channel: Channel, asked: string[], results: Authorized[]) {
  for (const [index, result] of results.entries()) {
    const topic = asked[index] as string;
    if ('refused' in result) channel.send('refused', { topic, code: result.refused });
    else await hub.attach(channel, topic, result);
  }
}

// El SSE abierto: el canal vive hasta que lo cierra la pestaña o el servidor.
async function serve(deps: Deps, stream: SSEStreamingApi, owner: Owner, granted: Granted) {
  const done = Promise.withResolvers<void>();
  const sink = { write: (text: string) => stream.write(text), close: () => done.resolve() };
  const id = randomBytes(16).toString('base64url');
  const channel = createChannel(id, owner, sink, realtimeSettings.maxPendingBytes);
  deps.admission.opened(channel);
  channel.onClose(() => deps.admission.closed(channel));
  deps.hub.open(channel);
  stream.onAbort(() => channel.close('client'));
  channel.send('hello', { channel: id });
  await attachAll(deps.hub, channel, granted.asked, granted.results);
  await done.promise;
}

type Granted = { asked: string[]; results: Authorized[] };

// Abrir: un tema rechazado no impide los otros; si no pasa ninguno, no se abre nada. Primero se admite
// el canal y después se autorizan los temas: autorizar puede guardar algo (la computadora del código),
// y un canal que no se abre no tiene que dejarlo (seguridad del código de 03, 16).
async function openChannel(deps: Deps, c: Context) {
  const asked = [...new Set(c.req.queries('s') ?? [])];
  if (!tokens.safeParse(asked).success || asked.length === 0) return fail(c, 400, 'bad-request');
  const [owner, listener] = await whoAsks(deps.sessions, c);
  const admitted = deps.admission.admit(owner);
  if (!admitted.allowed) return tooMany(c, admitted.retryAfterMs);
  const results = await Promise.all(asked.map((t) => deps.hub.authorize(owner, listener, t)));
  const accepted = results.filter((result) => !('refused' in result));
  const [first] = results;
  if (accepted.length === 0 && first && 'refused' in first)
    return fail(c, owner.kind === 'session' ? 403 : 401, first.refused);
  return streamSSE(c, (stream) => serve(deps, stream, owner, { asked, results }));
}

// Sumar o sacar temas de un canal propio, sin rehacerlo.
async function changeChannel(deps: Deps, c: Context) {
  const body = changeBody.safeParse(await c.req.json());
  if (!body.success) return fail(c, 400, 'bad-request');
  const channel = deps.hub.channels.get(body.data.channel);
  const [owner, listener] = await whoAsks(deps.sessions, c);
  if (!channel || !sameOwner(channel.owner, owner)) return fail(c, 404, 'not-found');
  if (!deps.admission.mayChange(channel))
    return tooMany(c, realtimeSettings.subscriptionChanges.windowMs);
  deps.hub.unsubscribe(channel, body.data.remove ?? []);
  const adding = (body.data.add ?? []).filter((t) => !channel.subscriptions.has(t));
  if (channel.subscriptions.size + adding.length > realtimeSettings.maxTopicsPerChannel)
    return fail(c, 400, 'bad-request');
  const results = await Promise.all(adding.map((t) => deps.hub.authorize(owner, listener, t)));
  await attachAll(deps.hub, channel, adding, results);
  return c.json({ listening: [...channel.subscriptions.keys()] });
}

export function registerRealtimeRoutes(deps: Deps): void {
  deps.http.get('/api/realtime', (c) => openChannel(deps, c));
  deps.http.post('/api/realtime/subscriptions', (c) => changeChannel(deps, c));
}

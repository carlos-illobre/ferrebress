// La central del canal en tiempo real (diseño de 03, § 3.3): qué canales están abiertos, quién puede
// escuchar cada tema y a quién entregarle lo que publica un módulo. No sabe qué significa ningún tema:
// le pregunta a su declaración quién puede escuchar y con qué clave. Todo en memoria, sin consultas;
// con varias copias del servidor, `publish` pasa a `LISTEN/NOTIFY` sin tocar a quien lo usa.
import type { ErrorCode } from '@ferrebress/shared/contracts/errors';
import type { Channel, ClosedReason, Owner } from './channel.ts';
import { createRegistry, type Granted, type Registry } from './registry.ts';
import type { AnyTopic, Listener, Topics } from './topics.ts';

export type { Granted };
export type Authorized = Granted | { refused: ErrorCode };

// Una suscripción pedida: `tema` o `tema:parámetro`.
export const parseToken = (token: string): { topic: string; raw: string } => {
  const colon = token.indexOf(':');
  return colon < 0
    ? { topic: token, raw: '' }
    : { topic: token.slice(0, colon), raw: token.slice(colon + 1) };
};

// Que lo que manda un tema tenga su forma: un error de programación no llega a la pestaña.
function deliver(channel: Channel, topic: AnyTopic, data: unknown): void {
  const parsed = topic.event.safeParse(data);
  if (!parsed.success) throw new Error(`El tema «${topic.name}» mandó algo sin su forma`);
  channel.send(topic.name, parsed.data);
}

// Si ese dueño puede escuchar ese tema pedido, y con qué clave; si no, por qué.
async function authorize(
  topics: Topics,
  owner: Owner,
  listener: Listener,
  token: string,
): Promise<Authorized> {
  const { topic: name, raw } = parseToken(token);
  const topic = topics.get(name);
  if (!topic) return { refused: 'not-found' };
  if (!topic.anonymous && owner.kind !== 'session') return { refused: 'not-authorized' };
  const param = topic.param.safeParse(raw);
  if (!param.success) return { refused: 'bad-request' };
  const authorization = await topic.authorize(listener, param.data);
  return 'refused' in authorization
    ? authorization
    : { topic, key: authorization.key, param: param.data };
}

type State = { topics: Topics; channels: Map<string, Channel>; registry: Registry };

function open({ channels, registry }: State, channel: Channel): void {
  channels.set(channel.id, channel);
  channel.onClose(() => {
    registry.forgetAll(channel);
    channels.delete(channel.id);
  });
}

// Empieza a escuchar un tema ya autorizado y le pide su estado de ahora (§ 3.4).
async function attach({ registry }: State, channel: Channel, token: string, granted: Granted) {
  if (channel.isClosed() || channel.subscriptions.has(token)) return;
  registry.listen(channel, token, granted);
  const send = (event: unknown) => deliver(channel, granted.topic, event);
  await granted.topic.onSubscribe?.(granted.key, send, granted.param);
}

// Entrega a quienes escuchan esa clave de ese tema; devuelve a cuántos.
function publish({ topics, registry }: State, name: string, key: string, data: unknown): number {
  const topic = topics.get(name);
  if (!topic) throw new Error(`El tema «${name}» no está declarado`);
  const listeners = registry.listenersOf(name, key);
  for (const channel of listeners) deliver(channel, topic, data);
  return listeners.length;
}

// Suelta a todos los que escuchan una clave que dejó de existir (un vínculo que terminó).
function drop({ registry }: State, name: string, key: string): void {
  for (const channel of registry.listenersOf(name, key))
    for (const token of registry.tokensOf(channel, name, key)) {
      registry.forget(channel, token);
      channel.send('dropped', { topic: token });
    }
}

// Vuelve a preguntar por cada suscripción de un canal a ese tema; la que ya no pasa se suelta.
async function recheckChannel({ registry }: State, channel: Channel, topic: AnyTopic) {
  const listener = channel.owner.kind === 'session' ? { session: channel.owner.session } : {};
  for (const [token, subscription] of [...channel.subscriptions]) {
    if (subscription.topic !== topic.name) continue;
    const authorization = await topic.authorize(listener, subscription.param);
    if ('key' in authorization && authorization.key === subscription.key) continue;
    registry.forget(channel, token);
    const code = 'refused' in authorization ? authorization.refused : 'not-authorized';
    channel.send('refused', { topic: token, code });
  }
}

// Vuelve a preguntarle al tema quién puede escuchar: el que ya no puede recibe `refused`.
async function recheck(state: State, name: string): Promise<void> {
  const topic = state.topics.get(name);
  if (!topic) return;
  for (const channel of [...state.channels.values()]) await recheckChannel(state, channel, topic);
}

// Cierra los canales de una sesión que terminó.
function closeSession({ channels }: State, sessionId: string, reason: ClosedReason): void {
  for (const channel of [...channels.values()])
    if (channel.owner.kind === 'session' && channel.owner.session.id === sessionId)
      channel.close(reason);
}

export function createHub(topics: Topics) {
  const state: State = { topics, channels: new Map(), registry: createRegistry(topics) };
  return {
    channels: state.channels,
    open: (channel: Channel) => open(state, channel),
    authorize: (owner: Owner, listener: Listener, token: string) =>
      authorize(topics, owner, listener, token),
    attach: (channel: Channel, token: string, granted: Granted) =>
      attach(state, channel, token, granted),
    unsubscribe(channel: Channel, tokens: string[]): void {
      for (const token of tokens) state.registry.forget(channel, token);
    },
    publish: (name: string, key: string, data: unknown) => publish(state, name, key, data),
    // Cuántas pestañas escuchan esa clave (si el otro lado de un vínculo está).
    listeners: (name: string, key: string) => state.registry.listenersOf(name, key).length,
    drop: (name: string, key: string) => drop(state, name, key),
    recheck: (name: string) => recheck(state, name),
    closeSession: (sessionId: string, reason: ClosedReason = 'session-ended') =>
      closeSession(state, sessionId, reason),
  };
}

export type Hub = ReturnType<typeof createHub>;

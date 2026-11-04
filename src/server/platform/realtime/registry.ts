// Quién escucha qué (diseño de 03, § 3.3): por cada tema y clave, los canales que la escuchan, y en
// cada canal, sus suscripciones. Las dos vistas cambian siempre juntas, acá y en ningún otro lugar.
import type { Channel } from './channel.ts';
import type { AnyTopic, Topics } from './topics.ts';

// Un tema que se puede escuchar: su declaración, la clave que dio y su parámetro ya validado.
export type Granted = { topic: AnyTopic; key: string; param: unknown };

const slot = (topic: string, key: string) => `${topic}\u0000${key}`;

export function createRegistry(topics: Topics) {
  const byKey = new Map<string, Set<Channel>>();

  const listen = (channel: Channel, token: string, granted: Granted): void => {
    const { topic, key, param } = granted;
    channel.subscriptions.set(token, { topic: topic.name, key, param });
    const listeners = byKey.get(slot(topic.name, key)) ?? new Set<Channel>();
    listeners.add(channel);
    byKey.set(slot(topic.name, key), listeners);
  };

  const forget = (channel: Channel, token: string): void => {
    const subscription = channel.subscriptions.get(token);
    if (!subscription) return;
    channel.subscriptions.delete(token);
    const listeners = byKey.get(slot(subscription.topic, subscription.key));
    listeners?.delete(channel);
    if (listeners?.size === 0) byKey.delete(slot(subscription.topic, subscription.key));
    topics.get(subscription.topic)?.onUnsubscribe?.(subscription.key);
  };

  return {
    listen,
    forget,
    forgetAll: (channel: Channel) => {
      for (const token of [...channel.subscriptions.keys()]) forget(channel, token);
    },
    listenersOf: (topic: string, key: string): Channel[] => [
      ...(byKey.get(slot(topic, key)) ?? []),
    ],
    // Las suscripciones de un canal a esa clave de ese tema.
    tokensOf: (channel: Channel, topic: string, key: string): string[] =>
      [...channel.subscriptions]
        .filter(([, subscription]) => subscription.topic === topic && subscription.key === key)
        .map(([token]) => token),
  };
}

export type Registry = ReturnType<typeof createRegistry>;

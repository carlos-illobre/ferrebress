// El canal en tiempo real del servidor, armado (diseño de 03, § 3, y ADR-017): los temas que declara
// cada módulo, la central, los topes, las rutas y el latido. Es lo que la plataforma le da a cada
// módulo como `realtime`: declarar un tema, publicar en una clave y soltar una clave.
import type { Events, ServerEvents } from '../events.ts';
import type { Http } from '../http.ts';
import type { RateLimiter } from '../limits/rate-limit.ts';
import type { SessionGate } from '../session.ts';
import { createAdmission, realtimeSettings } from './admission.ts';
import { createHub } from './hub.ts';
import { registerRealtimeRoutes } from './routes.ts';
import { createTopics, type TopicDefinition } from './topics.ts';

type Deps = {
  http: Http;
  sessions: SessionGate;
  limiter: RateLimiter;
  events: Events;
  every(ms: number, job: () => Promise<void>): void;
};

export function createRealtime({ http, sessions, limiter, events, every }: Deps) {
  const topics = createTopics();
  const hub = createHub(topics);
  const admission = createAdmission(limiter);
  registerRealtimeRoutes({ http, hub, sessions, admission });
  sessions.onEnded((session) => hub.closeSession(session.id));

  // Un solo temporizador para todos los canales: el latido, y cerrar los de una sesión que venció
  // sin que nadie lo dijera (tener el canal abierto no cuenta como uso de la sesión).
  every(realtimeSettings.beatEveryMs, async () => {
    for (const channel of [...hub.channels.values()]) {
      const { owner } = channel;
      if (owner.kind === 'session' && !sessions.isOpen(owner.session.id))
        channel.close('session-ended');
      else channel.beat();
    }
  });

  return {
    // Declarar un tema: sumar uno no toca el canal.
    topic<P, E>(definition: TopicDefinition<P, E>): void {
      topics.define(definition);
      for (const name of definition.recheckOn ?? [])
        events.on(name as keyof ServerEvents, async () => () => void hub.recheck(definition.name));
    },
    publish: hub.publish,
    drop: hub.drop,
    listeners: hub.listeners,
  };
}

export type Realtime = ReturnType<typeof createRealtime>;

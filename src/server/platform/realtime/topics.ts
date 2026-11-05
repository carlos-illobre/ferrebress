// Los temas del canal en tiempo real (diseño de 03, § 3.1): cada módulo declara lo que una pantalla
// puede esperar del servidor, quién puede escucharlo y con qué clave. El canal no sabe qué significa
// ningún tema: sumar uno es declararlo, sin tocar el canal (abierto a extensión, cerrado a cambios).
import type { ErrorCode } from '@ferrebress/shared/contracts/errors';
import type { Context } from 'hono';
import type * as z from 'zod/mini';
import type { ServerEvents } from '../events.ts';
import type { RequestSession } from '../session.ts';

// Quién pide escuchar: la sesión, si tiene, y el pedido, cuando lo hay (al volver a mirar los
// permisos no hay pedido: un tema que necesita el pedido, como una cookie, no usa `recheckOn`).
export type Listener = { session?: RequestSession; request?: Context };

// La clave separa a los oyentes de un mismo tema: lo publicado en una clave llega solo a quienes la
// escuchan (un lado de un vínculo, una pantalla de entrada).
export type Authorization = { key: string } | { refused: ErrorCode };

export type TopicDefinition<P, E> = {
  name: string;
  // El parámetro que trae la suscripción, como texto (`tema:parámetro`), y la forma de lo que se manda.
  param: z.ZodMiniType<P>;
  event: z.ZodMiniType<E>;
  authorize(listener: Listener, param: P): Authorization | Promise<Authorization>;
  // Al empezar a escuchar, el estado de ahora: así reconectarse nunca pierde nada (§ 3.4).
  onSubscribe?(key: string, send: (event: E) => void, param: P): void | Promise<void>;
  // Cuando una pestaña deja de escuchar esa clave.
  onUnsubscribe?(key: string): void;
  // Se puede escuchar sin sesión (la entrada).
  anonymous?: true;
  // Con estos eventos se vuelve a pasar `authorize` (un permiso que cambió).
  recheckOn?: (keyof ServerEvents)[];
};

// Un tema ya declarado, sin los tipos de su parámetro: lo que el canal guarda.
export type AnyTopic = TopicDefinition<unknown, unknown>;

export function createTopics() {
  const topics = new Map<string, AnyTopic>();
  return {
    define<P, E>(definition: TopicDefinition<P, E>): void {
      if (!/^[a-z][a-z-]*\.[a-z][a-z.-]*$/.test(definition.name))
        throw new Error(`El tema «${definition.name}» no es modulo.nombre`);
      if (topics.has(definition.name))
        throw new Error(`El tema «${definition.name}» ya está declarado`);
      topics.set(definition.name, definition as unknown as AnyTopic);
    },
    get: (name: string): AnyTopic | undefined => topics.get(name),
    // Los temas declarados: la prueba de cerrado por defecto los recorre.
    list: (): AnyTopic[] => [...topics.values()],
  };
}

export type Topics = ReturnType<typeof createTopics>;

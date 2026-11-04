// El canal en tiempo real de la pestaña (diseño de 03, § 3.2; ADR-017): a lo sumo uno, abierto solo
// mientras alguna pantalla pide un tema, la pestaña está a la vista y hay red (03 · R7.2). Sumar o
// sacar temas no lo rehace: se lo dice al servidor por su identificador. Los cambios de un mismo
// dibujo se juntan en una microtarea. Cada evento va a quienes pidieron su tema; el canal no sabe qué
// significa ninguno. Un tema se escucha con un solo parámetro por pestaña.
import { api, appHeaders } from '../server/api.ts';
import { canReach, watchReach } from '../server/reach.ts';
import { createDemand, type Demand, type TopicHandler } from './demand.ts';
import { openStream, type StreamEvent } from './sse.ts';

export type { TopicHandler };

// El canal abierto: los temas con que se abrió, su identificador cuando llegó el saludo, qué escucha
// según el servidor y cómo cerrarlo.
type Open = { close: () => void; id: string | undefined; asked: string[]; listening: Set<string> };
type State = {
  demand: Demand;
  current: Open | undefined;
  fetch: typeof fetch;
  schedule: () => void;
};

const topicOf = (token: string) => token.split(':')[0] as string;
const query = (tokens: string[]) => tokens.map((t) => `s=${encodeURIComponent(t)}`).join('&');
type Control = { channel?: string; topic?: string; code?: string };

// Los eventos del canal mismo, uno por nombre; los demás son de un tema.
const controls: Record<string, (state: State, opened: Open, data: Control) => void> = {
  hello(state, opened, data) {
    opened.id = data.channel;
    opened.listening = new Set(opened.asked);
    state.schedule();
  },
  refused(state, opened, data) {
    const token = data.topic as string;
    opened.listening.delete(token);
    for (const handler of state.demand.handlersOf(token)) handler.onRefused?.(data.code as string);
  },
  dropped(state, opened, data) {
    const token = data.topic as string;
    opened.listening.delete(token);
    for (const handler of state.demand.handlersOf(token)) handler.onDropped?.();
  },
  closed(_state, opened) {
    opened.id = undefined;
  },
};

function route(state: State, opened: Open, event: StreamEvent): void {
  const control = Object.hasOwn(controls, event.type) ? controls[event.type] : undefined;
  if (control) {
    control(state, opened, event.data as Control);
    return;
  }
  for (const token of opened.listening)
    if (topicOf(token) === event.type)
      for (const handler of state.demand.handlersOf(token)) handler.onEvent(event.data);
}

function open(state: State): void {
  // `close` llega enseguida, con el SSE que abre.
  const opened = { id: undefined, asked: [], listening: new Set() } as unknown as Open;
  opened.close = openStream({
    // En cada reconexión, con lo que esté pedido en ese momento.
    open: (signal) => {
      opened.asked = state.demand.tokens();
      opened.id = undefined;
      return state.fetch(`/api/realtime?${query(opened.asked)}`, { headers: appHeaders(), signal });
    },
    onEvent: (event) => route(state, opened, event),
    onRefused: (status) => {
      for (const token of opened.asked)
        for (const handler of state.demand.handlersOf(token)) handler.onRefused?.(String(status));
      // Un SSE cerrado no avisa nada: el que avisa es el de ahora.
      state.current = undefined;
    },
  });
  state.current = opened;
}

function close(state: State): void {
  state.current?.close();
  state.current = undefined;
}

// Le dice al servidor lo que cambió; si el canal ya no existe, lo vuelve a abrir.
async function change(state: State, opened: Open, add: string[], remove: string[]) {
  const body = { channel: opened.id, add, remove };
  const result = await api<{ listening: string[] }>('/api/realtime/subscriptions', body);
  if (state.current !== opened) return;
  if (result.ok) opened.listening = new Set(result.data.listening);
  else if (result.error === 'not-found') {
    close(state);
    state.schedule();
  }
}

// Deja el canal como lo pide la pestaña: cerrado, abierto o con los temas de ahora.
function sync(state: State): void {
  const wanted = state.demand.tokens();
  const opened = state.current;
  if (wanted.length === 0 || !canReach()) close(state);
  else if (!opened) open(state);
  else if (opened.id) reconcile(state, opened, wanted);
}

// Lo que falta sumar y sacar de un canal ya abierto.
function reconcile(state: State, opened: Open, wanted: string[]): void {
  const add = wanted.filter((token) => !opened.listening.has(token));
  const remove = [...opened.listening].filter((token) => !state.demand.has(token));
  if (add.length + remove.length > 0) void change(state, opened, add, remove);
}

export function createRealtimeChannel(fetcher: typeof fetch = globalThis.fetch.bind(globalThis)) {
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      sync(state);
    });
  };
  const state: State = {
    demand: createDemand(schedule),
    current: undefined,
    fetch: fetcher,
    schedule,
  };
  watchReach(schedule);
  return {
    // Pide un tema; devuelve cómo dejar de pedirlo.
    want: (token: string, handler: TopicHandler) => state.demand.want(token, handler),
    // Si hay un canal abierto.
    isOpen: () => state.current !== undefined,
  };
}

export type RealtimeChannel = ReturnType<typeof createRealtimeChannel>;

// El de la aplicación: uno solo por pestaña.
export const realtime = createRealtimeChannel();

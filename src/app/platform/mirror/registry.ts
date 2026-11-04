// El espejo (diseño de 03, § 5; ADR-017): los valores con nombre de lo que se ve, cada uno con su
// esquema y su reloj. Copia estado, no acciones: un registro «gana el último que escribe» por clave
// (LWW), con un reloj de Lamport y, en el empate, el que manda. Repetir o desordenar cambios no cambia
// el resultado. Sin puerto conectado, cada valor es un estado común con nombre. No sabe de vínculos,
// celulares ni computadoras: quien conecta el puerto dice si manda y por dónde viaja.
import type * as z from 'zod/mini';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

// Un cambio: la clave, el valor, el reloj y si lo hizo el que manda.
export type Patch = { k: string; v: Json; c: number; l: boolean };

// Hacia dónde salen los cambios mientras hay otro dispositivo: lo pone quien conecta.
export type Port = { send(patches: Patch[]): void; leader: boolean; over: 'direct' | 'relayed' };

// Lo que el espejo descarta, para el diario de quien lo conecta (sin el valor).
export type Discard = { key: string; why: 'schema' | 'too-large' | 'unknown' | 'from-follower' };

export const maxValueBytes = 64 * 1024;
const inboxLimits = { keys: 64, bytes: 1024 * 1024, ms: 10_000 };

type Entry = {
  value: Json;
  initial: Json;
  clock: number;
  leader: boolean;
  schema: z.ZodMiniType<unknown>;
  listeners: Set<(value: Json) => void>;
};

// Si el cambio `b` gana sobre lo que hay: reloj mayor, o el mismo reloj y lo hizo el que manda.
const wins = (b: { c: number; l: boolean }, a: { clock: number; leader: boolean }) =>
  b.c > a.clock || (b.c === a.clock && b.l && !a.leader);

export const sizeOf = (value: Json) => JSON.stringify(value).length;

// Lo que llega antes que su pantalla espera un rato, con topes de claves y de tamaño.
function createInbox(now: () => number) {
  const waiting = new Map<string, { patch: Patch; at: number }>();
  const sweep = () => {
    for (const [key, entry] of waiting) if (now() - entry.at > inboxLimits.ms) waiting.delete(key);
  };
  const bytes = () => [...waiting.values()].reduce((sum, { patch }) => sum + sizeOf(patch.v), 0);
  return {
    keep(patch: Patch): boolean {
      sweep();
      const fits =
        waiting.size < inboxLimits.keys && bytes() + sizeOf(patch.v) <= inboxLimits.bytes;
      if (fits || waiting.has(patch.k)) waiting.set(patch.k, { patch, at: now() });
      return fits;
    },
    take(key: string): Patch | undefined {
      sweep();
      const entry = waiting.get(key);
      waiting.delete(key);
      return entry?.patch;
    },
    clear: () => waiting.clear(),
  };
}

type Options = { now?: () => number; onDiscard?: (discard: Discard) => void };

// Un valor con nombre, como lo usa una pantalla.
export type MirroredValue<T extends Json> = {
  get(): T;
  // `auto`: lo eligió la pantalla sola (por su forma): cambia solo acá y no viaja.
  set(value: T, options?: { auto?: true }): void;
  subscribe(listener: (value: T) => void): () => void;
  release(): void;
};

type State = {
  entries: Map<string, Entry>;
  inbox: ReturnType<typeof createInbox>;
  clock: number;
  port: Port | undefined;
  onDiscard: (discard: Discard) => void;
};

function write(state: State, entry: Entry, patch: Patch): void {
  entry.value = patch.v;
  entry.clock = patch.c;
  entry.leader = patch.l;
  state.clock = Math.max(state.clock, patch.c);
  for (const listener of entry.listeners) listener(patch.v);
}

// Un cambio que llegó del otro: si tiene su forma y gana, se aplica sin volver a mandarlo. Lo que trae
// el servidor solo va del que manda al otro (§ 5.2).
function receiveOne(state: State, patch: Patch): void {
  const entry = state.entries.get(patch.k);
  if (patch.k.startsWith('q:') && state.port?.leader)
    state.onDiscard({ key: patch.k, why: 'from-follower' });
  else if (!entry) {
    if (!state.inbox.keep(patch)) state.onDiscard({ key: patch.k, why: 'unknown' });
  } else if (!entry.schema.safeParse(patch.v).success)
    state.onDiscard({ key: patch.k, why: 'schema' });
  else if (wins(patch, entry)) write(state, entry, patch);
}

// Un cambio de acá: sube el reloj y sale por el puerto, si hay y si no pesa de más.
function local(state: State, key: string, entry: Entry, value: Json): void {
  state.clock += 1;
  const patch = { k: key, v: value, c: state.clock, l: state.port?.leader ?? false };
  write(state, entry, patch);
  if (!state.port) return;
  if (sizeOf(value) > maxValueBytes) state.onDiscard({ key, why: 'too-large' });
  else state.port.send([patch]);
}

function register<T extends Json>(
  state: State,
  key: string,
  initial: T,
  schema: z.ZodMiniType<T>,
): MirroredValue<T> {
  if (state.entries.has(key)) throw new Error(`El valor «${key}» ya está registrado`);
  const entry: Entry = {
    value: initial,
    initial,
    clock: 0,
    leader: false,
    schema,
    listeners: new Set(),
  };
  state.entries.set(key, entry);
  const waiting = state.inbox.take(key);
  if (waiting) receiveOne(state, waiting);
  const listeners = entry.listeners as Set<(value: T) => void>;
  return {
    get: () => entry.value as T,
    set: (value, options) =>
      options?.auto
        ? write(state, entry, { k: key, v: value, c: entry.clock, l: entry.leader })
        : local(state, key, entry, value),
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    release: () => void state.entries.delete(key),
  };
}

// La foto (R6.3): todo lo vivo, marcado con un reloj más alto que el del otro: gana en los dos.
function snapshot(state: State, above: number, withQueries: boolean): Patch[] {
  state.clock = Math.max(state.clock, above) + 1;
  return [...state.entries]
    .filter(([key]) => withQueries || !key.startsWith('q:'))
    .map(([key, entry]) => ({ k: key, v: entry.value, c: state.clock, l: true }));
}

// Tomar la foto del que manda: lo que no trae vuelve a su valor inicial.
function adopt(state: State, photo: Patch[]): void {
  const keys = new Set(photo.map((patch) => patch.k));
  for (const [key, entry] of state.entries)
    if (!keys.has(key) && !key.startsWith('q:')) {
      state.clock += 1;
      write(state, entry, { k: key, v: entry.initial, c: state.clock, l: false });
    }
  for (const patch of photo) receiveOne(state, patch);
}

export function createMirror({ now = Date.now, onDiscard = () => undefined }: Options = {}) {
  const state: State = {
    entries: new Map(),
    inbox: createInbox(now),
    clock: 0,
    port: undefined,
    onDiscard,
  };
  return {
    register: <T extends Json>(key: string, initial: T, schema: z.ZodMiniType<T>) =>
      register(state, key, initial, schema),
    // Conectar con el otro dispositivo (lo hace quien sabe del vínculo) y desconectar.
    attach(port: Port): void {
      state.port = port;
    },
    detach(): void {
      state.port = undefined;
      state.inbox.clear();
    },
    port: () => state.port,
    receive(patches: Patch[]): void {
      for (const patch of patches) receiveOne(state, patch);
    },
    // El reloj más alto de acá: lo manda el que sigue en su saludo.
    highestClock: () => state.clock,
    snapshot: (above: number, withQueries: boolean) => snapshot(state, above, withQueries),
    adopt: (photo: Patch[]) => adopt(state, photo),
  };
}

export type Mirror = ReturnType<typeof createMirror>;

// El de la aplicación: uno solo.
export const mirror = createMirror();

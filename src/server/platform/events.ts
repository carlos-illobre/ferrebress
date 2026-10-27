// Los eventos dentro del proceso (constitución, XII): un módulo reacciona a otro sin conocerlo.
// Corren dentro de la transacción de quien publica, así lo que provocan se guarda junto o nada.
import type { Transaction } from 'kysely';

// Cada módulo agrega sus eventos a esta interfaz, con lo que lleva cada uno.
// biome-ignore lint/suspicious/noEmptyInterface: la completan los módulos.
export interface ServerEvents {}

type Handler<K extends keyof ServerEvents> = (
  payload: ServerEvents[K],
  trx: Transaction<unknown>,
) => Promise<void>;

export function createEvents() {
  const handlers = new Map<keyof ServerEvents, Handler<never>[]>();
  return {
    on<K extends keyof ServerEvents>(name: K, handler: Handler<K>): void {
      handlers.set(name, [...(handlers.get(name) ?? []), handler as Handler<never>]);
    },
    async publish<K extends keyof ServerEvents>(
      name: K,
      payload: ServerEvents[K],
      trx: Transaction<unknown>,
    ) {
      for (const handler of handlers.get(name) ?? []) await (handler as Handler<K>)(payload, trx);
    },
  };
}

export type Events = ReturnType<typeof createEvents>;

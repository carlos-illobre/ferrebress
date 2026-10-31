// Los eventos dentro del proceso (constitución, XII): un módulo reacciona a otro sin conocerlo.
// Corren dentro de la transacción de quien publica, así lo que provocan se guarda junto o nada. Lo
// que tiene que pasar recién después de confirmarla (poner al día una memoria, anotar en la
// auditoría) el que reacciona lo devuelve, y quien publica lo corre al terminar la transacción.
import type { Transaction } from 'kysely';

// Cada módulo agrega sus eventos a esta interfaz, con lo que lleva cada uno.
// biome-ignore lint/suspicious/noEmptyInterface: la completan los módulos.
export interface ServerEvents {}

export type AfterCommit = () => void;

type Handler<K extends keyof ServerEvents> = (
  payload: ServerEvents[K],
  trx: Transaction<unknown>,
) => Promise<undefined | AfterCommit>;

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
    ): Promise<AfterCommit[]> {
      const after: AfterCommit[] = [];
      for (const handler of handlers.get(name) ?? []) {
        const then = await (handler as Handler<K>)(payload, trx);
        if (then) after.push(then);
      }
      return after;
    },
  };
}

export type Events = ReturnType<typeof createEvents>;

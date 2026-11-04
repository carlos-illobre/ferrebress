// El transporte por el servidor (diseño de 03, § 4.3): lo que sale en los mismos 50 ms va en un lote,
// y lo que llega viene por el canal común. Quien lo crea le da cómo mandar un lote y cómo recibir:
// el transporte no nombra ninguna ruta ni tema. La latencia es lo que tarda el último envío, por dos.
import type { Json } from '../mirror/registry.ts';
import { createTransport } from './transport.ts';

export const relayedSettings = { batchMs: 50 };

type Options = {
  send(batch: Json[]): Promise<boolean>;
  subscribe(receive: (batch: Json[]) => void): () => void;
};

export function createRelayed({ send, subscribe }: Options) {
  let pending: Json[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let roundTrip: number | undefined;

  const flush = async () => {
    timer = undefined;
    const batch = pending;
    pending = [];
    const started = Date.now();
    const ok = await send(batch);
    roundTrip = (Date.now() - started) * 2;
    if (!ok) base.transport.close('lost');
  };

  // Lo que llega del otro, cada mensaje del lote.
  const stop = subscribe((batch) => {
    for (const message of batch) base.deliver(JSON.stringify(message));
  });
  const base = createTransport(
    'relayed',
    (text) => {
      pending.push(JSON.parse(text) as Json);
      timer ??= setTimeout(() => void flush(), relayedSettings.batchMs);
    },
    () => {
      clearTimeout(timer);
      stop();
    },
  );
  return { transport: base.transport, roundTripMs: () => roundTrip };
}

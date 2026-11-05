// El transporte por el servidor (diseño de 03, § 4.3): lo que sale en los mismos 50 ms va en un lote,
// y lo que llega viene por el canal común. Sale un lote por vez: el siguiente, cuando contestó el
// anterior, así el servidor no los entrega en otro orden (la foto en partes se perdería). Cada lote
// cabe en lo que el servidor acepta. Quien lo crea le da cómo mandar un lote y cómo recibir: el
// transporte no nombra ninguna ruta ni tema. La latencia es lo que tarda el último envío, por dos.
// Cerrarlo manda lo que quedaba pendiente.
import type { Json } from '../mirror/registry.ts';
import { platformSettings } from '../settings.ts';
import { bytesOf, createTransport } from './transport.ts';

type Options = {
  send(batch: Json[]): Promise<boolean>;
  subscribe(receive: (batch: Json[]) => void): () => void;
};

// El próximo lote: hasta 100 mensajes y 60 KB, en orden. Uno solo siempre entra (el transporte ya
// rechazó los de más de 64 KB).
function takeBatch(pending: { message: Json; bytes: number }[]): Json[] {
  const { maxMessages, maxBytes } = platformSettings.relayed;
  const batch: Json[] = [];
  let bytes = 0;
  while (pending.length > 0 && batch.length < maxMessages) {
    const next = pending[0] as { message: Json; bytes: number };
    if (batch.length > 0 && bytes + next.bytes > maxBytes) break;
    batch.push(next.message);
    bytes += next.bytes;
    pending.shift();
  }
  return batch;
}

export function createRelayed({ send, subscribe }: Options) {
  const pending: { message: Json; bytes: number }[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sending = false;
  let closed = false;
  let roundTrip: number | undefined;

  const flush = async () => {
    timer = undefined;
    sending = true;
    while (pending.length > 0 && !closed) {
      const started = Date.now();
      const ok = await send(takeBatch(pending));
      roundTrip = (Date.now() - started) * 2;
      if (!ok) base.transport.close('lost');
    }
    sending = false;
  };

  const base = createTransport(
    'relayed',
    (text) => {
      pending.push({ message: JSON.parse(text) as Json, bytes: bytesOf(text) });
      if (!sending) timer ??= setTimeout(() => void flush(), platformSettings.relayed.batchMs);
    },
    // Al cerrar, lo que quedaba por mandar sale igual (el adiós, la pausa), sin esperar respuesta.
    () => {
      closed = true;
      clearTimeout(timer);
      while (pending.length > 0) void send(takeBatch(pending));
      stopReceiving();
    },
  );
  // Lo que llega del otro, cada mensaje del lote. Se cierra siempre después de esto.
  const stopReceiving = subscribe((batch) => {
    for (const message of batch) base.deliver(JSON.stringify(message));
  });
  return { transport: base.transport, roundTripMs: () => roundTrip };
}

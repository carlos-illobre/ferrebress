// Un canal abierto (diseño de 03, § 3.2 y § 3.3): el SSE de una pestaña, con quién lo abrió, qué
// escucha y lo que falta escribir. Escribe solo nombres de evento que eligió el servidor y datos con
// JSON.stringify: un texto de un dispositivo no puede inventar campos de SSE.
import type { RequestSession } from '../session.ts';

// Hacia dónde se escribe: el SSE del pedido (un adaptador), o uno de mentira en las pruebas.
export type Sink = { write(text: string): Promise<unknown>; close(): void };

// El dueño se fija al abrir: una sesión, o nadie (la entrada), contado por su red.
export type Owner =
  | { kind: 'session'; session: RequestSession }
  | { kind: 'anonymous'; network: string };

// Lo que escucha: por cada `tema:parámetro`, el tema y la clave que le dio `authorize`.
export type Subscription = { topic: string; key: string; param: unknown };

export type ClosedReason = 'slow' | 'session-ended' | 'replaced' | 'server' | 'client';

export type Channel = ReturnType<typeof createChannel>;

export function createChannel(id: string, owner: Owner, sink: Sink, maxPendingBytes: number) {
  const subscriptions = new Map<string, Subscription>();
  const closeListeners: ((reason: ClosedReason) => void)[] = [];
  let pendingBytes = 0;
  let closed = false;

  const close = (reason: ClosedReason): void => {
    if (closed) return;
    closed = true;
    for (const listener of closeListeners) listener(reason);
    sink.close();
  };

  // Escribe y lleva la cuenta de lo que no salió: un celular que no lee no llena la memoria.
  const write = (text: string): void => {
    if (closed) return;
    pendingBytes += text.length;
    if (pendingBytes > maxPendingBytes) {
      close('slow');
      return;
    }
    void sink.write(text).then(
      () => {
        pendingBytes -= text.length;
      },
      () => close('client'),
    );
  };

  return {
    id,
    owner,
    subscriptions,
    isClosed: () => closed,
    // Un evento con nombre; el que cierra el canal avisa el motivo antes de cortar.
    send(event: string, data: unknown): void {
      write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    // El latido: un comentario de SSE, que la aplicación no muestra.
    beat: () => write(':\n\n'),
    close(reason: ClosedReason): void {
      if (closed) return;
      write(`event: closed\ndata: ${JSON.stringify({ reason })}\n\n`);
      close(reason);
    },
    onClose: (listener: (reason: ClosedReason) => void) => void closeListeners.push(listener),
  };
}

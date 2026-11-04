// Por dónde viajan los mensajes entre dos dispositivos (diseño de 03, § 4.1): directo por el Wi-Fi o
// por el servidor, con la misma forma. El transporte no conoce lo que lleva: lo valida quien lo usa.
// Un solo tope para los dos, 64 KB por mensaje. Lo común a los dos está una sola vez acá.
import type { Json } from '../mirror/registry.ts';

export type TransportKind = 'direct' | 'relayed';
export type CloseReason = 'lost' | 'closed' | 'replaced' | 'failed';

export interface Transport {
  readonly kind: TransportKind;
  // Nunca tira: cerrado, no hace nada; de más de 64 KB, lo rechaza y devuelve false.
  send(message: Json): boolean;
  onMessage(listener: (message: Json) => void): () => void;
  onClose(listener: (why: CloseReason) => void): () => void;
  // Se puede llamar más de una vez: solo la primera cierra.
  close(why: CloseReason): void;
}

export const maxMessageBytes = 64 * 1024;

// Lo de todo transporte: los que escuchan, el tope y cerrar una vez. Cada uno da cómo escribir y qué
// hacer al cerrar; el que lo usa le pasa lo que llega con `deliver`.
export function createTransport(
  kind: TransportKind,
  write: (text: string) => void,
  shut: () => void,
) {
  const messages = new Set<(message: Json) => void>();
  const closes = new Set<(why: CloseReason) => void>();
  let closed = false;
  const transport: Transport = {
    kind,
    send(message) {
      const text = JSON.stringify(message);
      if (closed || text.length > maxMessageBytes) return false;
      write(text);
      return true;
    },
    onMessage(listener) {
      messages.add(listener);
      return () => void messages.delete(listener);
    },
    onClose(listener) {
      closes.add(listener);
      return () => void closes.delete(listener);
    },
    close(why) {
      if (closed) return;
      closed = true;
      shut();
      for (const listener of closes) listener(why);
    },
  };
  // Lo que llegó del otro, ya como JSON; un texto que no es JSON no se entrega.
  const deliver = (text: string) => {
    if (closed) return;
    let message: Json;
    try {
      message = JSON.parse(text) as Json;
    } catch {
      return;
    }
    for (const listener of messages) listener(message);
  };
  return { transport, deliver };
}

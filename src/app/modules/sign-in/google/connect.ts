// La aplicación del lado del marco del botón de Google: le manda qué dibujar cuando el marco está
// listo y escucha cuándo quedó dibujado y el pase.
import { type FromFrame, messageFrom, type ShowGoogle, type ToFrame } from './messages.ts';

export type FrameEvents = { drawn: () => void; credential: (credential: string) => void };

export function connectGoogleFrame(frame: HTMLIFrameElement, events: FrameEvents) {
  let ready = false;
  let pending: ShowGoogle | undefined;
  const send = (show: ShowGoogle) =>
    frame.contentWindow?.postMessage({ type: 'show', ...show } satisfies ToFrame, location.origin);
  const listen = (event: MessageEvent) => {
    const message = messageFrom<FromFrame>(event, frame.contentWindow);
    if (message?.type === 'ready') {
      ready = true;
      if (pending) send(pending);
    }
    if (message?.type === 'drawn') events.drawn();
    if (message?.type === 'credential') events.credential(message.credential);
  };
  addEventListener('message', listen);
  return {
    show(show: ShowGoogle) {
      pending = show;
      if (ready) send(show);
    },
    stop: () => removeEventListener('message', listen),
  };
}

// Una pantalla pide un tema del canal mientras está montada (diseño de 03, § 3.2): sin tema
// (`undefined`), no pide nada. Lo que hace con cada evento puede cambiar entre dibujos sin volver a
// pedir el tema.
import { useEffect, useRef } from 'preact/hooks';
import { realtime, type TopicHandler } from './channel.ts';

export function useTopic(token: string | undefined, handler: TopicHandler): void {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (!token) return;
    return realtime.want(token, {
      onEvent: (data) => latest.current.onEvent(data),
      onRefused: (code) => latest.current.onRefused?.(code),
      onDropped: () => latest.current.onDropped?.(),
    });
  }, [token]);
}

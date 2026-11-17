// Lo último que se vio de una pantalla, de esa persona, en esta sesión de la aplicación: sin conexión
// se muestra gris, con la hora en que se vio.
import { useEffect } from 'preact/hooks';
import { serverNow } from '../../platform/server/clock.ts';

const kept = new Map<string, WeakMap<object, { data: unknown; at: Date }>>();

export function useLastSeen<T>(screen: string, who: object, data: T | undefined) {
  const seen = kept.get(screen) ?? new WeakMap();
  kept.set(screen, seen);
  useEffect(() => {
    if (data) seen.set(who, { data, at: serverNow() as Date });
  }, [data]);
  return seen.get(who) as { data: T; at: Date } | undefined;
}

// Lo que se baja recién al usarlo (una pantalla, una hoja), así no pesa en el arranque (diseño de 01,
// § 10). Si no se puede bajar habiendo red, es una versión vieja después de un despliegue: se pide
// actualizar (00 · R5); sin red, `useLazy` da 'offline', para que la pantalla lo diga.
import { useEffect, useState } from 'preact/hooks';
import { updateRequired } from './server/api.ts';

export function useLazy<T>(load: () => Promise<T>): T | 'offline' | undefined {
  const [loaded, setLoaded] = useState<{ module: T } | 'offline'>();
  useEffect(() => {
    load().then(
      (module) => setLoaded({ module }),
      () => {
        if (navigator.onLine) updateRequired.set(true);
        else setLoaded('offline');
      },
    );
  }, []);
  return loaded === 'offline' ? loaded : loaded?.module;
}

// Lo mismo, para lo que no dice nada sin red: mientras no está, no se ve.
export function useLoaded<T>(load: () => Promise<T>): T | undefined {
  const loaded = useLazy(load);
  return loaded === 'offline' ? undefined : loaded;
}

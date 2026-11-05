// Volver a probar la conexión cuando el navegador dice que hay red pero el último pedido falló: al
// salir del modo avión, Android avisa que hay red un instante antes de que ande, el primer pedido
// falla y el navegador ya no vuelve a avisar, así que la pantalla quedaba «sin conexión». Solo
// mientras `active` y con la pantalla a la vista: un pedido mínimo a los 2, 4, 8, 16 y 32 s, y
// después uno por minuto, hasta que uno llegue (docs/technical/mobile-data.md).
import { useEffect } from 'preact/hooks';
import { useCurrent } from '../current.ts';
import { platformSettings } from '../settings.ts';
import { useStore } from '../store.ts';
import { online as onlineStore } from './api.ts';
import { canReach, watchReach } from './reach.ts';

export function useReconnect(active: boolean, probe: () => void) {
  const online = useStore(onlineStore);
  const current = useCurrent(probe);
  useEffect(() => {
    if (!active || online) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;
    const next = () => {
      clearTimeout(timer);
      if (!canReach()) return;
      timer = setTimeout(() => {
        tries += 1;
        current();
        next();
      }, platformSettings.reconnect.delaysMs[tries] ?? platformSettings.reconnect.everyMs);
    };
    // Al volver a la vista o la red, se empieza de nuevo por la espera corta.
    const restart = () => {
      tries = 0;
      next();
    };
    restart();
    const stop = watchReach(restart);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [active, online]);
}

// Volver a probar la conexión cuando el navegador dice que hay red pero el último pedido falló: al
// salir del modo avión, Android avisa que hay red un instante antes de que ande, el primer pedido
// falla y el navegador ya no vuelve a avisar, así que la pantalla quedaba «sin conexión». Solo
// mientras `active` y con la pantalla a la vista: un pedido mínimo a los 2, 4, 8, 16 y 32 s, y
// después uno por minuto, hasta que uno llegue (docs/technical/mobile-data.md).
import { useEffect } from 'preact/hooks';
import { useStore } from '../store.ts';
import { online as onlineStore } from './api.ts';

export const reconnectDelaysMs = [2000, 4000, 8000, 16_000, 32_000];
export const reconnectEveryMs = 60_000;

const canProbe = () => document.visibilityState === 'visible' && navigator.onLine;

export function useReconnect(active: boolean, probe: () => void) {
  const online = useStore(onlineStore);
  useEffect(() => {
    if (!active || online) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;
    const next = () => {
      clearTimeout(timer);
      if (!canProbe()) return;
      timer = setTimeout(() => {
        tries += 1;
        probe();
        next();
      }, reconnectDelaysMs[tries] ?? reconnectEveryMs);
    };
    // Al volver a la vista o la red, se empieza de nuevo por la espera corta.
    const restart = () => {
      tries = 0;
      next();
    };
    restart();
    document.addEventListener('visibilitychange', restart);
    addEventListener('online', restart);
    addEventListener('offline', restart);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', restart);
      removeEventListener('online', restart);
      removeEventListener('offline', restart);
    };
  }, [active, online]);
}

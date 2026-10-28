// El pedido de Google de la entrada (el nonce de /api/start) vence a los 10 minutos: con la entrada
// abierta más tiempo, Google aceptaba la cuenta y el servidor la rechazaba por vencida. Se pide otro
// un minuto antes de que venza, pero solo con la entrada a la vista: cada nonce nuevo hace que
// Google vuelva a dibujar su botón, y eso baja unos 60 KB de Google (docs/technical/mobile-data.md).
// Oculta (otra pestaña, el celular bloqueado) no pide nada; al volver, si ya venció, pide uno.
import { googleNonceMinutes } from '@ferrebress/shared/contracts/sign-in';
import { useEffect } from 'preact/hooks';

export const renewAfterMs = (googleNonceMinutes - 1) * 60_000;

const visible = () => document.visibilityState === 'visible';

export function useNonceRenewal(nonce: string | undefined, shown: boolean, renew: () => void) {
  useEffect(() => {
    if (!shown || !nonce) return;
    let last = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // El próximo, a lo que le falta al que se tiene, no a un plazo entero desde ahora: si no, al
    // volver a la vista se pedía cuando el que se tenía ya había vencido. Si una vez no hubo
    // conexión, la próxima vuelta vuelve a probar.
    const follow = () => {
      clearTimeout(timer);
      timer = undefined;
      if (!visible()) return;
      const left = renewAfterMs - (Date.now() - last);
      if (left > 0) {
        timer = setTimeout(follow, left);
        return;
      }
      last = Date.now();
      renew();
      follow();
    };
    follow();
    document.addEventListener('visibilitychange', follow);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', follow);
    };
  }, [nonce, shown]);
}

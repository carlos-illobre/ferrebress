// El pedido de Google de la entrada (el nonce de /api/start) vence a los 10 minutos: con la entrada
// abierta más tiempo, Google aceptaba la cuenta y el servidor la rechazaba por vencida. Mientras se
// ve la entrada, se pide otro un minuto antes de que venza; y si el dispositivo estuvo dormido (el
// reloj se frena), apenas vuelve a la vista.
import { googleNonceMinutes } from '@ferrebress/shared/contracts/sign-in';
import { useEffect } from 'preact/hooks';

export const renewAfterMs = (googleNonceMinutes - 1) * 60_000;

export function useNonceRenewal(nonce: string | undefined, shown: boolean, renew: () => void) {
  useEffect(() => {
    if (!shown || !nonce) return;
    const since = Date.now();
    const timer = setTimeout(renew, renewAfterMs);
    const back = () => {
      if (document.visibilityState === 'visible' && Date.now() - since >= renewAfterMs) renew();
    };
    document.addEventListener('visibilitychange', back);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', back);
    };
  }, [nonce, shown]);
}

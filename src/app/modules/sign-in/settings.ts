// Los tiempos de la entrada en la aplicación: todos con nombre, en un lugar. Los del servidor, en su
// `settings.ts`.

import { offlineWindowHours } from '@ferrebress/shared/contracts/offline-sign-in';
import { googleNonceMinutes } from '@ferrebress/shared/contracts/sign-in';

const second = 1000;
const minute = 60 * second;

export const signInSettings = {
  google: {
    // El botón se da por dibujado cuando llegaron sus estilos y su marco, o a los 3 s.
    drawnWithinMs: 3 * second,
    // Si a los 8 s no apareció, dice que no se pudo y ofrece «Reintentar».
    failAfterMs: 8 * second,
    // El nonce vence a los 10 minutos: se pide uno nuevo un minuto antes.
    renewAfterMs: (googleNonceMinutes - 1) * minute,
  },
  offline: {
    // Cuánto se puede entrar sin conexión después de la última entrada con internet (15 · R2.2).
    windowMs: offlineWindowHours * 60 * minute,
    // Lo que se tolera que el reloj del dispositivo esté corrido.
    clockSlackMs: 5 * minute,
    // Cada cuánto se reintenta mandar una entrada sin conexión que no llegó.
    retryEveryMs: minute,
    // Cada cuánto se mira si venció la sesión sin conexión o la opción de entrar sin ella.
    checkEveryMs: minute,
  },
};

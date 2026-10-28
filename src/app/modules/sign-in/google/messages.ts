// Lo que se dicen la aplicación y el marco del botón de Google (diseño de 01, § 5). El botón vive
// en su propia página, /google-button.html, porque Google lo dibuja con estilos en línea: esa página
// es la única con esa excepción a la política de contenido, y la aplicación sigue estricta. Los dos
// son del mismo origen; cada uno solo escucha al otro.
import { forget, readStored, store } from '../../../platform/device/storage.ts';

export const googleFramePath = '/google-button.html';

// `theme`: el botón azul (la computadora) o el blanco (la entrada oscura del celular).
export type GoogleTheme = 'filled_blue' | 'outline';
export type ShowGoogle = {
  scriptUrl: string;
  clientId: string;
  nonce: string;
  width: number;
  theme: GoogleTheme;
};

export type ToFrame = { type: 'show' } & ShowGoogle;
export type FromFrame =
  | { type: 'ready' }
  | { type: 'drawn' }
  | { type: 'credential'; credential: string };

// Si el mensaje viene de `from` y de este mismo origen, su contenido.
export function messageFrom<T>(event: MessageEvent, from: unknown): T | undefined {
  return event.origin === location.origin && event.source === from ? (event.data as T) : undefined;
}

// Después de «Salir», la próxima vez que se dibuje el botón Google vuelve a pedir la cuenta (R2.1).
// Se anota en el dispositivo porque el botón se dibuja en el marco, que es otra página.
const forgetKey = 'google-forget';

export function forgetGoogleChoice(): void {
  store(forgetKey, true);
}

export function takeForgetGoogle(): boolean {
  const pending = readStored<boolean>(forgetKey) === true;
  forget(forgetKey);
  return pending;
}

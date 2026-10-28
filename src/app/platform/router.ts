// La dirección, como un valor compartido: el menú la cambia y lo que la muestra se entera. Atrás y
// adelante del navegador funcionan, y la dirección que abre la aplicación (el QR del celular lleva
// /link#<código>) se lee una vez y se puede limpiar. Qué pantalla corresponde a cada dirección
// llega con la primera pantalla de trabajo (módulo 03).
import { createStore } from './store.ts';

export type Location = { path: string; hash: string };

const current = (): Location => ({ path: location.pathname, hash: location.hash.slice(1) });

export const route = createStore<Location>(current());

addEventListener('popstate', () => route.set(current()));

export function navigate(path: string, { replace = false } = {}): void {
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  route.set(current());
}

// Saca lo que va después del # sin dejarlo en el historial: el código del QR no se tiene que
// poder volver a leer con «atrás».
export function clearHash(): void {
  navigate(location.pathname, { replace: true });
}

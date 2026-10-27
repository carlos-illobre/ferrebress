// Qué pantalla se ve según la dirección. Cada módulo registra sus direcciones en su index.ts; el
// marco muestra la que coincide. Atrás y adelante del navegador funcionan, y la dirección que
// abre la aplicación (el QR del celular lleva /link#<código>) se lee una vez y se puede limpiar.
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

export type Route<Screen> = { path: string; screen: Screen };

export const match = <Screen>(routes: Route<Screen>[], path: string): Screen | undefined =>
  routes.find((candidate) => candidate.path === path)?.screen;

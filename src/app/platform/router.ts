// La dirección, como un valor compartido: el menú la cambia y lo que la muestra se entera. Atrás y
// adelante del navegador funcionan, y la dirección que abre la aplicación (el QR del celular lleva
// /link#<código>) se lee una vez y se puede limpiar. Qué pantalla corresponde a cada dirección lo
// decide el marco, con la dirección de cada opción del menú. Una pantalla con algo sin guardar pone
// una guarda: antes de cambiar de dirección, se le pregunta.
import { createStore } from './store.ts';

// `state` es lo que guardó quien navegó (por ejemplo, desde dónde se abrió el manual).
export type Location = { path: string; hash: string; search: string; state: unknown };

const current = (): Location => ({
  path: location.pathname,
  hash: location.hash.slice(1),
  search: location.search,
  state: history.state,
});

export const route = createStore<Location>(current());

// Lo que pregunta la guarda: recibe cómo seguir, si la persona acepta irse.
type Ask = (go: () => void) => void;
let guard: Ask | undefined;

// El aviso propio del navegador al cerrar o recargar la pestaña con algo sin guardar.
const warnOnUnload = (event: Event) => event.preventDefault();

const release = (ask: Ask) => {
  if (guard !== ask) return;
  guard = undefined;
  removeEventListener('beforeunload', warnOnUnload);
};

// Mientras esté, cambiar de dirección (también con atrás) le pregunta antes; devuelve cómo sacarla.
// Lo que se abre encima sin cambiar la dirección (una hoja, con su paso en el historial) no pregunta.
export function guardNavigation(ask: Ask): () => void {
  if (guard) release(guard);
  guard = ask;
  addEventListener('beforeunload', warnOnUnload);
  return () => release(ask);
}

// Pregunta si hay guarda y la dirección cambia; al aceptar, la guarda se va y sigue.
const passGuard = (path: string, go: () => void) => {
  const ask = guard;
  if (!ask || path === route.get().path) return go();
  ask(() => {
    release(ask);
    go();
  });
};

addEventListener('popstate', () => {
  const asked = current();
  const before = route.get();
  if (!guard || asked.path === before.path) return route.set(asked);
  // Atrás ya cambió la dirección: se vuelve a poner la de antes y, si acepta, se va de nuevo.
  history.pushState(
    before.state,
    '',
    before.path + before.search + (before.hash && `#${before.hash}`),
  );
  passGuard(asked.path, () => history.back());
});

// Reemplazar sin estado conserva el que había: el manual cambia de paso sin perder desde dónde se
// abrió. `force` es para las salidas que impone el marco (perder el permiso, la sesión cerrada,
// «Salir»): no preguntan, y lo que no se guardó se pierde.
export function navigate(
  path: string,
  {
    replace = false,
    state,
    force = false,
  }: { replace?: boolean; state?: unknown; force?: boolean } = {},
): void {
  if (force && guard) release(guard);
  passGuard(new URL(path, location.href).pathname, () => {
    if (replace) history.replaceState(state ?? history.state, '', path);
    else history.pushState(state ?? null, '', path);
    route.set(current());
  });
}

// Saca lo que va después del # sin dejarlo en el historial: el código del QR no se tiene que
// poder volver a leer con «atrás».
export function clearHash(): void {
  navigate(location.pathname, { replace: true });
}

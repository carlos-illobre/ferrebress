// El único punto por donde la aplicación habla con el servidor (diseño de 01, § 10): pone las
// cabeceras, lee la versión, la hora y el ambiente que trae cada respuesta (ADR-003), se entera
// de si hay conexión sin consultar nada por su cuenta (00 · R4.3) y traduce los errores.
import {
  appVersionHeaderName,
  contractVersion,
  deviceIdHeaderName,
} from '@ferrebress/shared/contracts/contract-version';
import type { ErrorBody, ErrorCode } from '@ferrebress/shared/contracts/errors';
import { parseServerHeader, serverHeaderName } from '@ferrebress/shared/contracts/server-header';
import { deviceId } from '../device/device.ts';
import { createStore } from '../store.ts';
import { syncServerTime } from './clock.ts';
import { readFields } from './fields.ts';

// La versión de esta aplicación: el commit con que se construyó (vite.config.ts); en desarrollo,
// «dev», igual que el servidor local.
export const appVersion: string = import.meta.env.VITE_APP_VERSION;

export const online = createStore(navigator.onLine);
export const newVersion = createStore(false);
export const updateRequired = createStore(false);
// Por qué se cerró la sesión, si el servidor dijo que se cerró (R3.4).
export const sessionClosed = createStore<string | undefined>(undefined);
// Cuándo contestó bien el servidor por última vez, con la hora del dispositivo: lo escucha quien
// necesita saber del último contacto (entrar sin conexión, 15 · R2.2), sin que esto sepa para qué.
export const lastReply = createStore<number | undefined>(undefined);
// La huella de los permisos de la sesión que trajo la última respuesta (02 · R7.8).
export const permissionsHash = createStore<string | undefined>(undefined);

addEventListener('online', () => online.set(true));
addEventListener('offline', () => online.set(false));

export type ApiResult<T> =
  | { ok: true; data: T }
  | ({ ok: false; error: ErrorCode | 'offline' } & Record<string, unknown>);

// Lo que lleva todo pedido a /api, también el canal en tiempo real: la versión y el dispositivo.
export const appHeaders = (): Record<string, string> => ({
  [appVersionHeaderName]: String(contractVersion),
  [deviceIdHeaderName]: deviceId(),
});

// Un módulo puede sumar cabeceras a los pedidos sin que api() lo conozca (diseño de 03, § 7: el
// vínculo en las escrituras). Devuelve cómo dejar de sumarlas.
type Decorator = (request: { path: string; write: boolean }) => Record<string, string>;
const decorators = new Set<Decorator>();
export function decorate(decorator: Decorator): () => void {
  decorators.add(decorator);
  return () => void decorators.delete(decorator);
}
const decorated = (path: string, write: boolean) =>
  Object.assign({}, ...[...decorators].map((decorator) => decorator({ path, write })));

// Un módulo puede frenar las escrituras mientras pasa algo (el espejo aplicando un cambio del otro:
// lo que llegó del otro dispositivo nunca escribe con la sesión de este, diseño de 03, § 5.3). Una
// escritura frenada es un error de programación: se anota en la consola y no sale.
const writeGuards = new Set<() => boolean>();
export function guardWrites(blocked: () => boolean): () => void {
  writeGuards.add(blocked);
  return () => void writeGuards.delete(blocked);
}

export async function api<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  if (body !== undefined && [...writeGuards].some((blocked) => blocked())) {
    console.error(
      `Escritura frenada: ${path} salió mientras el espejo aplicaba un cambio del otro`,
    );
    return { ok: false, error: 'unexpected' };
  }
  const headers = { ...appHeaders(), ...decorated(path, body !== undefined) };
  const init: RequestInit =
    body === undefined
      ? { headers }
      : {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { ...headers, 'Content-Type': 'application/json' },
        };
  const response = await fetch(path, { ...init, ...(signal && { signal }) }).catch(() => undefined);
  if (response) await readServerHeader(response);
  // Sin respuesta, o sin JSON (el 502 de Caddy mientras el servidor se reinicia, una página de error
  // del proxy), no se llega al servidor: se sigue como sin conexión (R3.6).
  const data = (await response?.json().catch(() => undefined)) as (T & ErrorBody) | undefined;
  if (!response || data === undefined) {
    online.set(false);
    return { ok: false, error: 'offline' };
  }
  online.set(true);
  if (response.ok) {
    lastReply.set(Date.now());
    return { ok: true, data };
  }
  if (data.error === 'update-required') updateRequired.set(true);
  if (data.error === 'session-closed') sessionClosed.set(String(data.reason));
  return { ok: false, ...data };
}

async function readServerHeader(response: Response): Promise<void> {
  const header = parseServerHeader(response.headers.get(serverHeaderName));
  if (!header) return;
  syncServerTime(header.serverTime);
  if (header.version !== appVersion) newVersion.set(true);
  if (header.permissions) permissionsHash.set(header.permissions);
  await readFields(header.fields ?? {});
}

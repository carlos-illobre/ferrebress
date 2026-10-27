// El único punto por donde la aplicación habla con el servidor (diseño de 01, § 10): pone las
// cabeceras, lee la versión, la hora y el ambiente que trae cada respuesta (ADR-003), se entera
// de si hay conexión sin consultar nada por su cuenta (00 · R4.3) y traduce los errores.
import {
  appVersionHeaderName,
  contractVersion,
  deviceIdHeaderName,
} from '@ferrebress/shared/contracts/contract-version';
import type { ErrorBody, ErrorCode } from '@ferrebress/shared/contracts/errors';
import {
  type Environment,
  parseServerHeader,
  serverHeaderName,
} from '@ferrebress/shared/contracts/server-header';
import { syncServerTime } from './clock.ts';
import { deviceId } from './device.ts';
import { createStore } from './store.ts';

// La versión de esta aplicación: el commit con que se construyó (vite.config.ts); en desarrollo,
// «dev», igual que el servidor local.
export const appVersion: string = import.meta.env.VITE_APP_VERSION;

export const online = createStore(navigator.onLine);
export const environment = createStore<Environment | undefined>(undefined);
export const newVersion = createStore(false);
export const updateRequired = createStore(false);
// Por qué se cerró la sesión, si el servidor dijo que se cerró (R3.4).
export const sessionClosed = createStore<string | undefined>(undefined);

addEventListener('online', () => online.set(true));
addEventListener('offline', () => online.set(false));

export type ApiResult<T> =
  | { ok: true; data: T }
  | ({ ok: false; error: ErrorCode | 'offline' } & Record<string, unknown>);

export async function api<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    [appVersionHeaderName]: String(contractVersion),
    [deviceIdHeaderName]: deviceId(),
  };
  const init: RequestInit =
    body === undefined
      ? { headers }
      : {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { ...headers, 'Content-Type': 'application/json' },
        };
  let response: Response;
  try {
    response = await fetch(path, { ...init, ...(signal && { signal }) });
  } catch {
    online.set(false);
    return { ok: false, error: 'offline' };
  }
  online.set(true);
  readServerHeader(response);
  const data = (await response.json()) as T & ErrorBody;
  if (response.ok) return { ok: true, data };
  if (data.error === 'update-required') updateRequired.set(true);
  if (data.error === 'session-closed') sessionClosed.set(String(data.reason));
  return { ok: false, ...data };
}

function readServerHeader(response: Response): void {
  const header = parseServerHeader(response.headers.get(serverHeaderName));
  if (!header) return;
  syncServerTime(header.serverTime);
  environment.set(header.environment);
  if (header.version !== appVersion) newVersion.set(true);
}

// Lo que vale para todos los pedidos de /api (diseño de 01, § 4 y § 13): la cabecera con la
// versión y la hora, la dirección real, y el rechazo de lo que no viene de la aplicación.

import type { IncomingMessage } from 'node:http';
import { isIP } from 'node:net';
import {
  appVersionHeaderName,
  deviceIdHeaderName,
} from '@ferrebress/shared/contracts/contract-version';
import type { ErrorCode } from '@ferrebress/shared/contracts/errors';
import {
  type Environment,
  formatServerHeader,
  serverHeaderName,
} from '@ferrebress/shared/contracts/server-header';
import { type Context, Hono, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AuditLog } from './audit.ts';
import type { Clock } from './clock.ts';
import type { RateLimiter } from './rate-limit.ts';
import { platformSettings } from './settings.ts';

export type HttpVariables = { ipAddress: string; deviceId: string | undefined };
export type Http = Hono<{ Variables: HttpVariables }>;

export type HttpOptions = {
  environment: Environment;
  version: string;
  publicOrigin: string;
  trustedProxy: string;
  clock: Clock;
  audit: AuditLog;
  limiter: RateLimiter;
  remoteAddress?: (c: Context) => string | undefined;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// En el servidor de Node, la dirección de la conexión; fuera de él (las pruebas), ninguna.
const nodeRemoteAddress = (c: Context): string | undefined =>
  (c.env as { incoming?: IncomingMessage } | undefined)?.incoming?.socket.remoteAddress;

export const fail = (c: Context, status: ContentfulStatusCode, error: ErrorCode, extra = {}) =>
  c.json({ error, ...extra }, status);

export function createHttp(options: HttpOptions): Http {
  const http: Http = new Hono();
  const reject = rejecter(options);
  http.use('/api/*', identify(options), stamp(options));
  http.use(
    '/api/*',
    bodyLimit({ maxSize: platformSettings.bodyLimitBytes, onError: (c) => reject(c, 'size') }),
  );
  http.use('/api/*', guard(options.publicOrigin, reject));
  http.notFound((c) => fail(c, 404, 'not-found'));
  http.onError((error, c) => {
    // Un cuerpo que no es JSON es un pedido mal hecho, no una falla: sin traza en el registro.
    if (error instanceof SyntaxError) return reject(c, 'body');
    console.error(error);
    return fail(c, 500, 'unexpected');
  });
  return http;
}

// Una IPv4 que llega por un socket IPv6 viene escrita «::ffff:172.30.0.10»: se la deja como IPv4,
// así se la puede comparar con la de Caddy.
const plain = (address: string) => address.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/, '');

// La dirección real la resuelve Caddy y la pasa en X-Real-IP, una sola; solo se le cree si el
// pedido viene de él y si es una dirección.
function identify({
  trustedProxy,
  remoteAddress = nodeRemoteAddress,
}: HttpOptions): MiddlewareHandler {
  return async (c, next) => {
    const remote = plain(remoteAddress(c) ?? 'desconocida');
    const real = c.req.header('X-Real-IP')?.trim();
    const fromCaddy = remote === trustedProxy && real !== undefined && isIP(real) !== 0;
    c.set('ipAddress', fromCaddy ? plain(real) : remote);
    const deviceId = c.req.header(deviceIdHeaderName);
    c.set('deviceId', deviceId && uuid.test(deviceId) ? deviceId : undefined);
    await next();
  };
}

function stamp({ version, environment, clock }: HttpOptions): MiddlewareHandler {
  return async (c, next) => {
    await next();
    const serverTime = clock.now().getTime();
    c.header(serverHeaderName, formatServerHeader({ version, serverTime, environment }));
    c.header('Cache-Control', 'no-store');
  };
}

type Reason = 'size' | 'origin' | 'content-type' | 'device' | 'contract' | 'version' | 'body';

function guard(
  publicOrigin: string,
  reject: (c: Context, reason: Reason) => Response,
): MiddlewareHandler {
  return async (c, next) => {
    const reason = rejectionReason(c, publicOrigin);
    if (reason) return reject(c, reason);
    await next();
  };
}

// Todo pedido trae el dispositivo (un UUID) y la versión del contrato (un entero); sin ellos no
// viene de la aplicación. No los piden /api/health, que miran el despliegue y Docker, ni los
// canales en tiempo real, que el navegador abre sin cabeceras propias (EventSource) y que
// identifica su cookie.
const withoutApp = (c: Context) =>
  c.req.path === '/api/health' ||
  (c.req.method === 'GET' && c.req.path.startsWith('/api/realtime/'));

function rejectionReason(c: Context, publicOrigin: string): Reason | undefined {
  if (withoutApp(c)) return undefined;
  if (!c.get('deviceId')) return 'device';
  const contract = Number(c.req.header(appVersionHeaderName) || Number.NaN);
  if (!Number.isInteger(contract)) return 'contract';
  if (contract < platformSettings.minContractVersion) return 'version';
  if (c.req.method === 'GET' || c.req.method === 'HEAD') return undefined;
  if (c.req.header('Origin') !== publicOrigin) return 'origin';
  if (c.req.header('Content-Type')?.split(';')[0] !== 'application/json') return 'content-type';
  return undefined;
}

function rejecter({ audit, limiter, clock }: HttpOptions) {
  return (c: Context, reason: Reason): Response => {
    const ipAddress = c.get('ipAddress') as string;
    const hit = limiter.hit(
      `rejected:${reason}:${ipAddress}`,
      platformSettings.rejectedAuditWindow,
    );
    if (hit.allowed) {
      const repeated = (hit.previousCount ?? 1) - 1;
      const data = { reason, path: c.req.path, ...(repeated > 0 && { repeatedBefore: repeated }) };
      audit.record({ type: 'request.rejected', at: clock.now(), ipAddress, data });
    }
    return reason === 'version' ? fail(c, 426, 'update-required') : fail(c, 400, 'bad-request');
  };
}

// Lo que vale para todos los pedidos de /api (diseño de 01, § 4 y § 13): la cabecera con la
// versión y la hora, la dirección real, y el rechazo de lo que no viene de la aplicación.
import type { IncomingMessage } from 'node:http';
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
    console.error(error);
    return fail(c, 500, 'unexpected');
  });
  return http;
}

// La dirección real la pone Caddy en X-Forwarded-For; solo se le cree si el pedido viene de él.
function identify({
  trustedProxy,
  remoteAddress = nodeRemoteAddress,
}: HttpOptions): MiddlewareHandler {
  return async (c, next) => {
    const remote = remoteAddress(c) ?? 'desconocida';
    const forwarded = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim();
    c.set('ipAddress', remote === trustedProxy && forwarded ? forwarded : remote);
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

type Reason = 'size' | 'origin' | 'content-type' | 'device' | 'version';

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

function rejectionReason(c: Context, publicOrigin: string): Reason | undefined {
  if (c.req.header(deviceIdHeaderName) && !c.get('deviceId')) return 'device';
  const contract = Number(c.req.header(appVersionHeaderName));
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

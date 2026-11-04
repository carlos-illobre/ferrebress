// Arma el servidor a partir de la configuración: abre la base y la auditoría, migra cada módulo
// y registra sus rutas. Separado de main.ts para que se pueda probar sin abrir un puerto.
import { sql } from 'kysely';
import { type Clock, systemClock } from './platform/clock.ts';
import type { Config } from './platform/config.ts';
import { createEvents } from './platform/events.ts';
import { createHeaderFields } from './platform/header-fields.ts';
import { createHttp } from './platform/http.ts';
import { createRateLimiter } from './platform/limits/rate-limit.ts';
import type { Platform, ServerModule } from './platform/modules.ts';
import { createPermissionGate } from './platform/permissions.ts';
import { createRealtime } from './platform/realtime/realtime.ts';
import { createRequestChecks } from './platform/request-checks.ts';
import { createSessionGate } from './platform/session.ts';
import { openAuditLog } from './platform/storage/audit/write.ts';
import { migrate, openDatabase } from './platform/storage/db.ts';

// Cómo se programa un trabajo periódico; las pruebas pasan uno que corre cuando ellas quieren.
export type Schedule = (ms: number, run: () => void) => () => void;
const intervals: Schedule = (ms, run) => {
  const timer = setInterval(run, ms).unref();
  return () => clearInterval(timer);
};

export async function createServer(
  config: Config,
  modules: ServerModule[],
  {
    clock = systemClock,
    schedule = intervals,
    onQuery,
  }: { clock?: Clock; schedule?: Schedule; onQuery?: () => void } = {},
) {
  const db = await openDatabase<unknown>(config.DATABASE_URL, onQuery);
  await migrate(
    db,
    modules.flatMap((module) => (module.schema ? [module.schema] : [])),
  );
  const audit = openAuditLog(config.AUDIT_PATH);
  const limiter = createRateLimiter(clock);
  const header = createHeaderFields();
  const checks = createRequestChecks();
  const http = createHttp({
    ...{ environment: config.ENVIRONMENT, version: config.VERSION },
    ...{ publicOrigin: config.PUBLIC_ORIGIN, trustedProxy: config.TRUSTED_PROXY },
    ...{ clock, audit, limiter, fields: header, checks },
  });
  const stops: (() => void)[] = [];
  const closing: (() => Promise<void>)[] = [];
  const sessions = createSessionGate();
  const events = createEvents();
  const every: Platform['every'] = (ms, job) => {
    const run = () => job().catch((error: unknown) => console.error(error));
    stops.push(schedule(ms, run));
  };
  const platform: Platform = {
    ...{ config, db, audit, clock, limiter, events, http, header, checks, sessions, every },
    permissions: createPermissionGate({ audit, clock, limiter }, sessions),
    realtime: createRealtime({ http, sessions, limiter, events, every }),
    onClose: (job) => void closing.push(job),
  };

  http.get('/api/health', async (c) => {
    await sql`select 1`.execute(db);
    return c.json({ ok: true, version: config.VERSION });
  });
  for (const module of modules) await module.register(platform);

  const close = async () => {
    for (const stop of stops) stop();
    for (const job of closing) await job();
    audit.close();
    await db.destroy();
  };
  return { http, platform, close };
}

// Arma el servidor a partir de la configuración: abre la base y la auditoría, migra cada módulo
// y registra sus rutas. Separado de main.ts para que se pueda probar sin abrir un puerto.
import { sql } from 'kysely';
import { openAuditLog } from './platform/audit.ts';
import { type Clock, systemClock } from './platform/clock.ts';
import type { Config } from './platform/config.ts';
import { migrate, openDatabase } from './platform/db.ts';
import { createEvents } from './platform/events.ts';
import { createHttp } from './platform/http.ts';
import type { Platform, ServerModule } from './platform/modules.ts';
import { createRateLimiter } from './platform/rate-limit.ts';

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
  const http = createHttp({
    environment: config.ENVIRONMENT,
    version: config.VERSION,
    publicOrigin: config.PUBLIC_ORIGIN,
    trustedProxy: config.TRUSTED_PROXY,
    clock,
    audit,
    limiter,
  });
  const stops: (() => void)[] = [];
  const closing: (() => Promise<void>)[] = [];
  const platform: Platform = {
    ...{ config, db, audit, clock, limiter, events: createEvents(), http },
    every(ms, job) {
      const run = () => job().catch((error: unknown) => console.error(error));
      stops.push(schedule(ms, run));
    },
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

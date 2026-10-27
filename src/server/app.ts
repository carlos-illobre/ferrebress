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

export async function createServer(
  config: Config,
  modules: ServerModule[],
  clock: Clock = systemClock,
) {
  const db = await openDatabase<unknown>(config.DATABASE_URL);
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
  const platform: Platform = { config, db, audit, clock, limiter, events: createEvents(), http };

  http.get('/api/health', async (c) => {
    await sql`select 1`.execute(db);
    return c.json({ ok: true, version: config.VERSION });
  });
  for (const module of modules) await module.register(platform);

  const close = async () => {
    audit.close();
    await db.destroy();
  };
  return { http, platform, close };
}

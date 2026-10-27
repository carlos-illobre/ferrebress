import type { Kysely } from 'kysely';
import type { AuditLog } from './audit.ts';
import type { Clock } from './clock.ts';
import type { Config } from './config.ts';
import type { ModuleSchema } from './db.ts';
import type { Http } from './http.ts';
import type { RateLimiter } from './rate-limit.ts';

// Lo que la plataforma le da a cada módulo al registrarlo.
export type Platform = {
  config: Config;
  db: Kysely<unknown>;
  audit: AuditLog;
  clock: Clock;
  limiter: RateLimiter;
  http: Http;
};

// Un módulo del servidor: su esquema, si guarda algo, y sus rutas.
export type ServerModule = {
  name: string;
  schema?: ModuleSchema;
  register(platform: Platform): void;
};

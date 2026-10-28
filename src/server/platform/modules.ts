// El contrato entre la plataforma y cada módulo del servidor (ADR-001): lo que un módulo recibe
// al registrarse y lo que tiene que dar.
import type { Kysely } from 'kysely';
import type { AuditLog } from './audit.ts';
import type { Clock } from './clock.ts';
import type { Config } from './config.ts';
import type { ModuleSchema } from './db.ts';
import type { Events } from './events.ts';
import type { Http } from './http.ts';
import type { RateLimiter } from './limits/rate-limit.ts';

// Lo que la plataforma le da a cada módulo al registrarlo.
export type Platform = {
  config: Config;
  db: Kysely<unknown>;
  audit: AuditLog;
  clock: Clock;
  limiter: RateLimiter;
  events: Events;
  http: Http;
  // Un trabajo que corre cada tanto, sin frenar el cierre del proceso.
  every(ms: number, job: () => Promise<void>): void;
  // Lo que hay que hacer antes de cerrar (escribir lo que quedó en memoria).
  onClose(job: () => Promise<void>): void;
};

// Un módulo del servidor: su esquema, si guarda algo, y sus rutas.
export type ServerModule = {
  name: string;
  schema?: ModuleSchema;
  register(platform: Platform): void | Promise<void>;
};

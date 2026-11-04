// El contrato entre la plataforma y cada módulo del servidor (ADR-001): lo que un módulo recibe
// al registrarse y lo que tiene que dar.
import type { Kysely } from 'kysely';
import type { Clock } from './clock.ts';
import type { Config } from './config.ts';
import type { Events } from './events.ts';
import type { HeaderFields } from './header-fields.ts';
import type { Http } from './http.ts';
import type { RateLimiter } from './limits/rate-limit.ts';
import type { PermissionGate } from './permissions.ts';
import type { Realtime } from './realtime/realtime.ts';
import type { RequestChecks } from './request-checks.ts';
import type { SessionGate } from './session.ts';
import type { StartParts } from './start-parts.ts';
import type { AuditLog } from './storage/audit/write.ts';
import type { ModuleSchema } from './storage/db.ts';

// Lo que la plataforma le da a cada módulo al registrarlo.
export type Platform = {
  config: Config;
  db: Kysely<unknown>;
  audit: AuditLog;
  clock: Clock;
  limiter: RateLimiter;
  events: Events;
  http: Http;
  // Los campos que un módulo suma a la cabecera de cada respuesta (diseño de 03, § 3.5).
  header: HeaderFields;
  // Los pasos que un módulo suma a todos los pedidos, antes de cualquier ruta.
  checks: RequestChecks;
  // Lo que un módulo suma a /api/start, con sesión (diseño de 03, § 10.1).
  start: StartParts;
  // La sesión del pedido: sign-in da cómo se resuelve; cualquier módulo la exige con `require`.
  sessions: SessionGate;
  // El permiso de cada ruta: users da cómo se saben; cualquier módulo lo pide con `require(id)`.
  permissions: PermissionGate;
  // El canal en tiempo real: cada módulo declara sus temas y publica en sus claves (diseño de 03, § 3).
  realtime: Realtime;
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

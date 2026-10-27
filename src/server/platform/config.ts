import { environments } from '@ferrebress/shared/contracts/server-header';
import * as z from 'zod/mini';

const text = z.string().check(z.minLength(1));
const googleIssuer = 'https://accounts.google.com';
const googleScript = 'https://accounts.google.com/gsi/client';

// Lo que cambia entre ambientes, del .env (diseño de 01, § 11). Sin valores por omisión.
const configSchema = z.object({
  ENVIRONMENT: z.enum(environments),
  VERSION: text,
  PORT: z.coerce.number().check(z.int(), z.positive()),
  PUBLIC_ORIGIN: z.url(),
  DATABASE_URL: text,
  AUDIT_PATH: text,
  GOOGLE_CLIENT_ID: text,
  GOOGLE_ISSUER: z.url(),
  GOOGLE_JWKS_URL: z.url(),
  GOOGLE_SCRIPT_URL: z.url(),
  GEO_DATABASE_PATH: text,
  INITIAL_ADMIN_EMAIL: z.email(),
  TRUSTED_PROXY: text,
});

export type Config = z.infer<typeof configSchema>;

export class ConfigError extends Error {}

// Lee la configuración o falla diciendo qué variables faltan o están mal, nunca sus valores.
export function readConfig(env: Record<string, string | undefined>): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new ConfigError(`Faltan o están mal estas variables del .env: ${names.join(', ')}`);
  }
  assertRealGoogle(result.data);
  return result.data;
}

// Fuera de las pruebas de punta a punta, Google es el de verdad: con un emisor de prueba,
// cualquiera que lea el repositorio podría fabricar un pase (revisión de seguridad, punto 9).
function assertRealGoogle(config: Config): void {
  if (config.ENVIRONMENT === 'e2e') return;
  if (config.GOOGLE_ISSUER !== googleIssuer || config.GOOGLE_SCRIPT_URL !== googleScript) {
    throw new ConfigError(
      `Con ENVIRONMENT=${config.ENVIRONMENT}, GOOGLE_ISSUER y GOOGLE_SCRIPT_URL tienen que ser los de Google`,
    );
  }
}

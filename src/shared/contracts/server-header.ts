// La cabecera X-Ferrebress que lleva cada respuesta: la forma `piggyback` del ADR-003.
import { product } from './product.ts';

export const serverHeaderName = `X-${product.name}`;

export const environments = ['testing', 'production', 'e2e'] as const;
export type Environment = (typeof environments)[number];

// `permissions`: con sesión, la huella de los permisos de quien pregunta (02 · R7.8).
export type ServerHeader = {
  version: string;
  serverTime: number;
  environment: Environment;
  permissions?: string;
};

export const formatServerHeader = (header: ServerHeader): string =>
  `v=${header.version}; t=${header.serverTime}; e=${header.environment}` +
  (header.permissions ? `; p=${header.permissions}` : '');

export function parseServerHeader(value: string | null): ServerHeader | undefined {
  const fields = Object.fromEntries(
    (value ?? '').split(';').map((field) => field.trim().split('=') as [string, string]),
  );
  const environment = environments.find((name) => name === fields.e);
  const serverTime = Number(fields.t);
  if (!fields.v || !environment || !Number.isSafeInteger(serverTime)) return undefined;
  const permissions = /^[0-9a-f]{8}$/.test(fields.p ?? '') ? fields.p : undefined;
  return { version: fields.v, serverTime, environment, ...(permissions && { permissions }) };
}

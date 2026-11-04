// La cabecera X-Ferrebress que lleva cada respuesta: la forma `piggyback` del ADR-003.
import { product } from './product.ts';

export const serverHeaderName = `X-${product.name}`;

export const environments = ['testing', 'production', 'e2e'] as const;
export type Environment = (typeof environments)[number];

// `permissions`: con sesión, la huella de los permisos de quien pregunta (02 · R7.8). `fields`: lo que
// suma cada módulo, una letra y un valor corto (diseño de 03, § 3.5): la cabecera no los conoce.
export type ServerHeader = {
  version: string;
  serverTime: number;
  environment: Environment;
  permissions?: string;
  fields?: Record<string, string>;
};

// Las letras que usa la cabecera misma; un módulo elige otra.
export const reservedFields = new Set(['v', 't', 'e', 'p']);
export const fieldLetter = /^[a-z]$/;
export const fieldValue = /^[0-9A-Za-z_-]{1,32}$/;

export const formatServerHeader = (header: ServerHeader): string =>
  `v=${header.version}; t=${header.serverTime}; e=${header.environment}` +
  (header.permissions ? `; p=${header.permissions}` : '') +
  Object.entries(header.fields ?? {})
    .map(([letter, value]) => `; ${letter}=${value}`)
    .join('');

// Los campos que sumó algún módulo, solo los que tienen la forma de un campo.
const extraFields = (fields: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(fields).filter(
      ([letter, value]) =>
        fieldLetter.test(letter) && !reservedFields.has(letter) && fieldValue.test(value),
    ),
  );

export function parseServerHeader(value: string | null): ServerHeader | undefined {
  const fields = Object.fromEntries(
    (value ?? '').split(';').map((field) => field.trim().split('=') as [string, string]),
  );
  const environment = environments.find((name) => name === fields.e);
  const serverTime = Number(fields.t);
  if (!fields.v || !environment || !Number.isSafeInteger(serverTime)) return undefined;
  const permissions = /^[0-9a-f]{8}$/.test(fields.p ?? '') ? fields.p : undefined;
  const extra = extraFields(fields);
  return {
    version: fields.v,
    serverTime,
    environment,
    ...(permissions && { permissions }),
    ...(Object.keys(extra).length > 0 && { fields: extra }),
  };
}

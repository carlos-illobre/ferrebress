// Si la persona con sesión puede prender «Trabajar sin conexión» en este dispositivo (15 · R1;
// diseño de 15, § 4): desde un celular, con su propia huella vinculada en él y con el permiso. Solo
// se pregunta con sesión: sin ella, el servidor no dice nada de la huella de un celular. De quién
// es la huella de cada celular queda en memoria después de la primera consulta.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import type { SignInContext } from '../context.ts';
import { isPhone } from '../device.ts';
import { canWorkOffline } from './rules.ts';

export async function ownerOf(ctx: SignInContext, deviceId: string): Promise<string | undefined> {
  if (ctx.phoneOwners.has(deviceId)) return ctx.phoneOwners.get(deviceId);
  const owner = (await ctx.passkeys.findActiveByDevice(deviceId))?.userId;
  ctx.phoneOwners.set(deviceId, owner);
  return owner;
}

export async function canGoOffline(ctx: SignInContext, c: Context, userId: string) {
  if (!isPhone(c.req.header('User-Agent'), c.req.header('Sec-CH-UA-Mobile'))) return false;
  // Con la sesión abierta, la persona está activa.
  return (
    (await ownerOf(ctx, c.get('deviceId') as string)) === userId && canWorkOffline({ active: true })
  );
}

// La persona como la muestra la aplicación, con `offline` si puede.
export const withOffline = async (ctx: SignInContext, c: Context, person: Person) =>
  (await canGoOffline(ctx, c, person.userId)) ? { ...person, offline: true as const } : person;

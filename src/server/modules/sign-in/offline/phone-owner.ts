// De quién es la huella de cada celular, y si la persona con sesión puede prender «Trabajar sin
// conexión» en él (15 · R1; diseño de 15, § 4): desde un celular, con su propia huella vinculada
// en él y con el permiso. Solo con sesión, y con el celular de la sesión, no el que diga el pedido:
// sin sesión el servidor no dice nada de la huella de un celular. De quién es la huella queda en
// memoria después de la primera consulta, con un tope.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import type { SignInContext } from '../context.ts';
import { isPhone } from '../device.ts';
import { canWorkOffline } from './rules.ts';

// Lo recuerda; si ya hay demasiados, empieza de cero (se vuelven a consultar).
export function remember<T>(known: Map<string, T>, key: string, value: T, max = 10_000): void {
  if (known.size >= max) known.clear();
  known.set(key, value);
}

export async function ownerOf(ctx: SignInContext, deviceId: string): Promise<string | undefined> {
  if (ctx.phoneOwners.has(deviceId)) return ctx.phoneOwners.get(deviceId);
  const owner = (await ctx.passkeys.findActiveByDevice(deviceId))?.userId;
  remember(ctx.phoneOwners, deviceId, owner);
  return owner;
}

// La persona de la sesión de `deviceId` como la muestra la aplicación, con `offline` si puede.
export async function withOffline(
  ctx: SignInContext,
  c: Context,
  { person, deviceId }: { person: Person; deviceId: string },
): Promise<Person> {
  if (!isPhone(c.req.header('User-Agent'), c.req.header('Sec-CH-UA-Mobile'))) return person;
  // Con la sesión abierta, la persona está activa.
  const can = (await ownerOf(ctx, deviceId)) === person.userId && canWorkOffline({ active: true });
  return can ? { ...person, offline: true } : person;
}

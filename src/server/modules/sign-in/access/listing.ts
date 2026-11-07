// Lo que se ve de las sesiones y las huellas de una persona, con las mismas dos consultas: la tarjeta
// de Usuarios (02 · R5.1, R5.2, R5.5) y lo mío, agrupado por dispositivo (04 · R1.8; diseño de 04b,
// § 3). Nunca la sesión del pedido, que se cierra con «Salir». El último uso, el de la memoria si es
// más nuevo (02, § 4); el nombre de cada dispositivo, el de la memoria (04 · R9.4).
import type {
  MyComputer,
  MyDevice,
  MyDevicesResponse,
  MySession,
} from '@ferrebress/shared/contracts/device-settings';
import type { AccessResponse } from '@ferrebress/shared/contracts/users';
import type { RequestSession } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { ownerOf } from '../offline/phone-owner.ts';
import { signInSettings } from '../settings.ts';
import { accessData } from './data.ts';

const time = (at: Date | null) => (at ? at.getTime() : null);

async function read(ctx: SignInContext, userId: string, asking: RequestSession) {
  const data = accessData(ctx.platform.db as never);
  const now = ctx.platform.clock.now();
  const [open, passkeys] = await Promise.all([
    data.openSessionsOf(userId, asking.id, now, signInSettings.session),
    data.passkeysOf(userId),
  ]);
  const lastUsed = (id: string, stored: Date) =>
    Math.max(stored.getTime(), ctx.store.lastUsedOf(id)?.getTime() ?? 0);
  const sessions = open.map((s) => ({
    ...s,
    createdAt: s.createdAt.getTime(),
    lastUsedAt: lastUsed(s.id, s.lastUsedAt),
  }));
  return { sessions, passkeys };
}

// El nombre del dispositivo, si tiene (de la memoria).
function nameOf(ctx: SignInContext, deviceId: string): { name?: string } {
  const name = ctx.devices.nameOf(deviceId);
  return name ? { name } : {};
}
const deviceNameOf = (ctx: SignInContext, deviceId: string): { deviceName?: string } => {
  const { name } = nameOf(ctx, deviceId);
  return name ? { deviceName: name } : {};
};

// La tarjeta de Usuarios: sus sesiones abiertas y sus celulares con huella, también los propios.
export async function accessCard(
  ctx: SignInContext,
  userId: string,
  asking: RequestSession,
): Promise<AccessResponse> {
  const { sessions, passkeys } = await read(ctx, userId, asking);
  return {
    sessions: sessions.map(({ deviceId, approvedBy: _, ...s }) => ({
      ...s,
      ...deviceNameOf(ctx, deviceId),
    })),
    phones: passkeys.map(({ deviceId, passkeyId: _, ...p }) => ({
      ...p,
      ...deviceNameOf(ctx, deviceId),
      createdAt: p.createdAt.getTime(),
      lastUsedAt: time(p.lastUsedAt),
    })),
  };
}

type Read = Awaited<ReturnType<typeof read>>;
type Row = Read['sessions'][number];

const sessionOfRow = (s: Row): MySession => ({
  id: s.id,
  way: s.way,
  createdAt: s.createdAt,
  lastUsedAt: s.lastUsedAt,
});

// Las sesiones de otros dispositivos: las de las computadoras que un celular propio hizo entrar con
// su código, debajo de ese celular, y las demás sueltas.
function byPhone(ctx: SignInContext, asking: RequestSession, { sessions, passkeys }: Read) {
  const phoneOf = new Map(passkeys.map((p) => [p.passkeyId, p.deviceId]));
  const computersOf = new Map<string, MyComputer[]>();
  const loose: Row[] = [];
  for (const s of sessions) {
    if (s.deviceId === asking.deviceId) continue;
    const phone = s.approvedBy ? phoneOf.get(s.approvedBy) : undefined;
    if (!phone) {
      loose.push(s);
      continue;
    }
    const computer = { label: s.deviceLabel, ...nameOf(ctx, s.deviceId), session: sessionOfRow(s) };
    computersOf.set(phone, [...(computersOf.get(phone) ?? []), computer]);
  }
  return { loose, computersOf };
}

// Lo mío: este dispositivo, los otros (cada uno con su sesión y su huella) y, debajo de cada celular,
// las computadoras que hizo entrar con su código (R1.8).
export async function myDevices(
  ctx: SignInContext,
  asking: RequestSession,
): Promise<MyDevicesResponse> {
  const { sessions, passkeys } = await read(ctx, asking.userId, asking);
  const { loose, computersOf } = byPhone(ctx, asking, { sessions, passkeys });
  const mine = passkeys.find((p) => p.deviceId === asking.deviceId);
  const other = !mine && asking.isPhone && (await ownerOf(ctx, asking.deviceId)) !== undefined;
  return {
    here: {
      label: asking.deviceLabel,
      ...nameOf(ctx, asking.deviceId),
      isPhone: asking.isPhone,
      passkey: mine ? 'mine' : other ? 'other' : 'none',
      ...(mine && {
        since: { createdAt: mine.createdAt.getTime(), lastUsedAt: time(mine.lastUsedAt) },
      }),
      computers: computersOf.get(asking.deviceId) ?? [],
    },
    others: othersOf(ctx, asking, { loose, passkeys, computersOf }),
    names: ctx.devices.othersThan(asking.deviceId),
  };
}

// Los otros dispositivos: los que tienen una sesión abierta o una huella, uno por dispositivo.
function othersOf(
  ctx: SignInContext,
  asking: RequestSession,
  {
    loose,
    passkeys,
    computersOf,
  }: { loose: Row[]; passkeys: Read['passkeys']; computersOf: Map<string, MyComputer[]> },
): MyDevice[] {
  const devices = new Map<string, MyDevice>();
  // De la más vieja a la más nueva: si un dispositivo tiene dos, queda la usada más recientemente.
  for (const s of loose.toReversed()) {
    devices.set(s.deviceId, {
      ...{ key: s.id, label: s.deviceLabel, ...nameOf(ctx, s.deviceId), isPhone: s.isPhone },
      ...{ session: sessionOfRow(s), passkey: null, computers: computersOf.get(s.deviceId) ?? [] },
    });
  }
  for (const p of passkeys) {
    if (p.deviceId === asking.deviceId) continue;
    const passkey = { createdAt: p.createdAt.getTime(), lastUsedAt: time(p.lastUsedAt) };
    const known = devices.get(p.deviceId);
    devices.set(p.deviceId, {
      ...{ key: p.id, label: p.deviceLabel, ...nameOf(ctx, p.deviceId), isPhone: true },
      ...{ session: known?.session ?? null, passkey, computers: computersOf.get(p.deviceId) ?? [] },
    });
  }
  return [...devices.values()];
}

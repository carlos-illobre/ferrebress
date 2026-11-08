// Lo que comparten las piezas del vínculo en el servidor: la plataforma, las consultas, la memoria de
// quién es del vínculo, los códigos del QR, los boletos de reemplazar y los pasos comunes de las rutas.
import type { Kysely } from 'kysely';
import { createGuards } from '../../platform/guards.ts';
import { createOneUse } from '../../platform/limits/one-use.ts';
import type { Platform } from '../../platform/modules.ts';
import { createRotatingCodes } from '../../platform/realtime/rotating-codes.ts';
import { type DeviceLinkTables, deviceLinkData } from './data.ts';
import { createMembers } from './members.ts';
import { type Device, labelOf, type Names, type Pairing } from './rules.ts';
import { deviceLinkSettings } from './settings.ts';

// El boleto de reemplazar (R1.4): con qué sesión del celular se pidió, los dos dispositivos y qué
// vínculos iba a terminar. Cambia solo con esa sesión y con los mismos vínculos.
export type Ticket = {
  phoneSessionId: string;
  computerSessionId: string;
  phone: Device;
  computer: Device;
  replaces: string[];
};

export type DeviceLinkDependencies = {
  wait: (ms: number) => Promise<void>;
  // Los días del vínculo de ahora, de Administración (R2.2, 06 · R7).
  pairingDays: () => number;
};

export function createDeviceLinkContext(
  platform: Platform,
  { wait, pairingDays }: DeviceLinkDependencies,
) {
  const data = deviceLinkData(platform.db as Kysely<DeviceLinkTables>);
  const now = () => platform.clock.now().getTime();
  return {
    platform,
    data,
    pairingDays,
    // El nombre de cada dispositivo, de la memoria de sign-in (04 · R9.4).
    names: ((deviceId) => platform.devices.nameOf(deviceId)) as Names,
    // Las consultas dentro de una transacción de otro (un aviso de Entrar o de Usuarios).
    dataIn: (trx: unknown) => deviceLinkData(trx as Kysely<DeviceLinkTables>),
    members: createMembers(data),
    codes: createRotatingCodes({ ttlMs: deviceLinkSettings.codeTtlMs, wait, now }),
    // La computadora que muestra cada código, por la sesión que lo escucha.
    computers: new Map<string, Device>(),
    tickets: createOneUse<Ticket>(platform.clock, {
      ttlMs: deviceLinkSettings.ticketTtlMs,
      maxTotal: deviceLinkSettings.ticketsMax,
      maxPerOwner: 1,
      replaceOldest: true,
    }),
    ...createGuards(platform, { topic: 'device-link', window: deviceLinkSettings.throttledAudit }),
  };
}

export type DeviceLinkContext = ReturnType<typeof createDeviceLinkContext>;

// Los dos dispositivos de un vínculo, como objetivos de la auditoría, por su nombre de ese momento y
// nunca por su identificador: es lo único que ata una sesión a un dispositivo (diseño de 04b, § 8).
export const targetsOf = (pairing: Pairing, names: Names) => [
  { kind: 'phone', id: '', name: labelOf(pairing, 'phone', names) },
  { kind: 'computer', id: '', name: labelOf(pairing, 'computer', names) },
];

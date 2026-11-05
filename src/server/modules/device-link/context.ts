// Lo que comparten las piezas del vínculo en el servidor: la plataforma, las consultas, la memoria de
// quién es del vínculo, los códigos del QR, los boletos de reemplazar y los pasos comunes de las rutas.
import type { Kysely } from 'kysely';
import { createGuards } from '../../platform/guards.ts';
import { createOneUse } from '../../platform/limits/one-use.ts';
import type { Platform } from '../../platform/modules.ts';
import { createRotatingCodes } from '../../platform/realtime/rotating-codes.ts';
import { type DeviceLinkTables, deviceLinkData } from './data.ts';
import { createMembers } from './members.ts';
import type { Device, Pairing } from './rules.ts';
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

export type DeviceLinkDependencies = { wait: (ms: number) => Promise<void> };

export function createDeviceLinkContext(platform: Platform, { wait }: DeviceLinkDependencies) {
  const data = deviceLinkData(platform.db as Kysely<DeviceLinkTables>);
  const now = () => platform.clock.now().getTime();
  return {
    platform,
    data,
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

// Los dos dispositivos de un vínculo, como objetivos de la auditoría (con su nombre de ese momento).
export const targetsOf = (pairing: Pairing) => [
  { kind: 'phone', id: pairing.phoneDeviceId, name: pairing.phoneLabel },
  { kind: 'computer', id: pairing.computerDeviceId, name: pairing.computerLabel },
];

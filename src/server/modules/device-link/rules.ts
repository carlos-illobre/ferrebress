// Las reglas del vínculo, sin tecnología (diseño de 03, § 9 a § 11; capítulo 03): de qué lado es cada
// dispositivo, qué vínculos termina uno nuevo, cuándo vence y cómo lo ve cada lado.

import type { PairingView, Side } from '@ferrebress/shared/contracts/device-link';
import { deviceLinkSettings } from './settings.ts';

export type Pairing = {
  id: string;
  userId: string;
  phoneDeviceId: string;
  computerDeviceId: string;
  phoneLabel: string;
  computerLabel: string;
  pairedBy: 'button' | 'sign-in';
  createdAt: Date;
  mirroredAt: Date;
  pausedAt: Date | null;
};

// Un dispositivo de una persona, con lo que el servidor sabe de él por su sesión.
export type Device = { userId: string; deviceId: string; label: string; isPhone: boolean };

export const sideOf = (device: { isPhone: boolean }): Side =>
  device.isPhone ? 'phone' : 'computer';
export const otherSide = (side: Side): Side => (side === 'phone' ? 'computer' : 'phone');

export const deviceOf = (pairing: Pairing, side: Side) =>
  side === 'phone' ? pairing.phoneDeviceId : pairing.computerDeviceId;

// Si ese vínculo ya es el de esos dos dispositivos (volver a vincular lo renueva, no lo reemplaza).
export const isSamePair = (pairing: Pairing, phone: Device, computer: Device) =>
  pairing.userId === phone.userId &&
  pairing.phoneDeviceId === phone.deviceId &&
  pairing.computerDeviceId === computer.deviceId;

// Los vínculos de la persona que uno nuevo termina: el del celular con otra computadora y el de la
// computadora con otro celular (R1.1, uno con uno).
export const replacedBy = (existing: Pairing[], phone: Device, computer: Device): Pairing[] =>
  existing.filter(
    (pairing) =>
      !isSamePair(pairing, phone, computer) &&
      pairing.userId === phone.userId &&
      (pairing.phoneDeviceId === phone.deviceId || pairing.computerDeviceId === computer.deviceId),
  );

// Lo que el celular le pregunta a la persona antes de reemplazar (R1.4).
export function replacesOf(replaced: Pairing[], phone: Device, computer: Device) {
  const ofPhone = replaced.find((pairing) => pairing.phoneDeviceId === phone.deviceId);
  const ofComputer = replaced.find((pairing) => pairing.computerDeviceId === computer.deviceId);
  return {
    ...(ofPhone && { phone: ofPhone.computerLabel }),
    ...(ofComputer && { computer: true as const }),
  };
}

const day = 24 * 60 * 60_000;

export const viewOf = (pairing: Pairing, side: Side): PairingView => ({
  id: pairing.id,
  side,
  other: { label: side === 'phone' ? pairing.computerLabel : pairing.phoneLabel },
  since: pairing.createdAt.getTime(),
  lastMirrored: pairing.mirroredAt.getTime(),
  expiresAt: pairing.mirroredAt.getTime() + deviceLinkSettings.pairingDays * day,
  lastsDays: deviceLinkSettings.pairingDays,
  paused: pairing.pausedAt !== null,
});

// Por qué terminó solo un vínculo (R2.3), por cada aviso de otro módulo.
export type EndReason =
  | 'expired'
  | 'session-revoked'
  | 'passkey-removed'
  | 'phone-cut'
  | 'deactivated';

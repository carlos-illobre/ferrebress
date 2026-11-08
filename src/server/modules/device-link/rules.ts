// Las reglas del vínculo, sin tecnología (diseño de 03, § 9 a § 11; capítulo 03): de qué lado es cada
// dispositivo, qué vínculos termina uno nuevo, cuándo vence y cómo lo ve cada lado.

import type { PairingView, Side } from '@ferrebress/shared/contracts/device-link';

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

// El nombre de cada dispositivo, si tiene (04 · R9): lo da sign-in, por la plataforma.
export type Names = (deviceId: string) => string | undefined;

// Cómo se llama un lado: su nombre o, sin nombre, la etiqueta guardada al vincular. No pisa nada:
// al borrar el nombre vuelve sola la etiqueta (diseño de 04b, § 5).
export const labelOf = (pairing: Pairing, side: Side, names: Names) =>
  names(deviceOf(pairing, side)) ?? (side === 'phone' ? pairing.phoneLabel : pairing.computerLabel);

// Lo que el celular le pregunta a la persona antes de reemplazar (R1.4).
export function replacesOf(replaced: Pairing[], phone: Device, computer: Device, names: Names) {
  const ofPhone = replaced.find((pairing) => pairing.phoneDeviceId === phone.deviceId);
  const ofComputer = replaced.find((pairing) => pairing.computerDeviceId === computer.deviceId);
  return {
    ...(ofPhone && { phone: labelOf(ofPhone, 'computer', names) }),
    ...(ofComputer && { computer: true as const }),
  };
}

const day = 24 * 60 * 60_000;

export const viewOf = (pairing: Pairing, side: Side, names: Names, days: number): PairingView => ({
  id: pairing.id,
  side,
  other: { label: labelOf(pairing, otherSide(side), names) },
  since: pairing.createdAt.getTime(),
  lastMirrored: pairing.mirroredAt.getTime(),
  expiresAt: pairing.mirroredAt.getTime() + days * day,
  lastsDays: days,
  paused: pairing.pausedAt !== null,
});

// Si ya pasaron los días del vínculo desde la última vez que espejaron (R2.2, 06 · R7.3).
export const isDue = (lastMirrored: number, days: number, now: number): boolean =>
  now - lastMirrored >= days * day;

// Por qué terminó solo un vínculo (R2.3), por cada aviso de otro módulo.
export type EndReason =
  | 'expired'
  | 'session-revoked'
  | 'passkey-removed'
  | 'phone-cut'
  | 'deactivated';

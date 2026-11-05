// Quién es del vínculo, en memoria (diseño de 03, § 9): el vínculo de cada persona en cada dispositivo
// (también «ninguno», así un dispositivo sin vínculo no consulta la base), la sesión que usa cada lado
// y la huella DTLS que registró en la última presentación. Contesta «ser del vínculo» (E38, E39) sin
// consultas. Con varias copias del servidor, esto pasa a la base o a un aviso entre copias.
import type { Side } from '@ferrebress/shared/contracts/device-link';
import { createGuardedMemory } from '../../platform/memory.ts';
import type { DeviceLinkData } from './data.ts';
import { deviceOf, type Pairing } from './rules.ts';

const slot = (pairingId: string, side: Side) => `${pairingId}:${side}`;
const sides = ['phone', 'computer'] as const;
// La clave de cada dispositivo del vínculo, con lo que queda en memoria para él.
const devicesOf = <V>(pairing: Pairing, value: V) =>
  sides.map((side) => [`${pairing.userId}:${deviceOf(pairing, side)}`, value] as const);

// Espejaron ahora: se escribe por tandas (R2.2).
function mirroredLog() {
  const mirrored = new Map<string, Date>();
  return {
    mirroredNow: (pairingId: string, at: Date) => void mirrored.set(pairingId, at),
    drainMirrored(): [string, Date][] {
      const entries = [...mirrored];
      mirrored.clear();
      return entries;
    },
  };
}

export function createMembers(data: DeviceLinkData) {
  const byDevice = createGuardedMemory<string, Pairing | null>();
  const sessions = new Map<string, string>();
  const fingerprints = new Map<string, string>();

  return {
    // El vínculo de esa persona en ese dispositivo, o ninguno.
    pairingOf: (userId: string, deviceId: string): Promise<Pairing | null> =>
      byDevice.load(
        `${userId}:${deviceId}`,
        async () => (await data.forDevice(userId, deviceId)) ?? null,
      ),
    // Después de confirmar un vínculo nuevo, renovado o pausado: sus dos dispositivos lo tienen, sin
    // volver a la base. Así `l=` cambia en la próxima respuesta de cada uno (§ 3.5).
    known(pairing: Pairing): void {
      byDevice.settle(devicesOf(pairing, pairing));
    },
    // Vínculos que terminaron: sus dispositivos quedan sin vínculo, y se sueltan sus sesiones y sus
    // huellas DTLS.
    ended(pairings: Pairing[]): void {
      byDevice.settle(pairings.flatMap((pairing) => devicesOf(pairing, null)));
      for (const pairing of pairings)
        for (const side of sides) {
          sessions.delete(slot(pairing.id, side));
          fingerprints.delete(slot(pairing.id, side));
        }
    },
    // El vínculo de ese dispositivo si ya está en memoria (la cabecera no espera a la base).
    knownPairingOf: (userId: string, deviceId: string) => byDevice.peek(`${userId}:${deviceId}`),
    // La sesión que usa ese lado ahora (al escuchar el tema o confirmar).
    useSession: (pairingId: string, side: Side, sessionId: string) =>
      void sessions.set(slot(pairingId, side), sessionId),
    sessionOf: (pairingId: string, side: Side) => sessions.get(slot(pairingId, side)),
    // La huella DTLS que registró ese lado al presentarse (§ 7).
    registerFingerprint: (pairingId: string, side: Side, fingerprint: string) =>
      void fingerprints.set(slot(pairingId, side), fingerprint),
    fingerprintOf: (pairingId: string, side: Side) => fingerprints.get(slot(pairingId, side)),
    ...mirroredLog(),
  };
}

export type Members = ReturnType<typeof createMembers>;

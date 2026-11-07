// Los nombres de los dispositivos en la memoria del servidor (diseño de 04b, § 2): se cargan al
// arrancar y quedan al día con cada cambio, así la auditoría, la entrada, el vínculo y las listas los
// leen sin consultar la base. También el último día que se usó cada uno, escrito por tandas junto con
// los últimos usos de las sesiones y como mucho una vez por día por dispositivo.
import type { Platform } from '../../../platform/modules.ts';
import { signInSettings } from '../settings.ts';
import { devicesData } from './data.ts';

const day = 24 * 60 * 60 * 1000;
const { devices: settings } = signInSettings;

// Los que ya se anotaron como usados hoy, y los que faltan escribir.
function createSeen(clock: Platform['clock'], write: (ids: string[]) => Promise<void>) {
  let today = -1;
  const seenToday = new Set<string>();
  const pending = new Set<string>();
  return {
    touch(deviceId: string) {
      const now = Math.floor(clock.now().getTime() / day);
      if (now !== today) {
        today = now;
        seenToday.clear();
      }
      if (seenToday.has(deviceId)) return;
      seenToday.add(deviceId);
      pending.add(deviceId);
    },
    async flush() {
      const ids = [...pending];
      pending.clear();
      if (ids.length > 0) await write(ids);
    },
  };
}

export function createDeviceNames({ db, clock, events }: Platform) {
  const data = devicesData(db as never);
  const names = new Map<string, string>();
  const seen = createSeen(clock, (ids) => data.seen(ids, clock.now()));
  const remember = (deviceId: string, name: string | null) => {
    names.delete(deviceId);
    if (name === null) return;
    // Con el tope lleno, se olvida el que hace más que no cambia (una ferretería tiene decenas).
    if (names.size >= settings.maxInMemory) names.delete(names.keys().next().value as string);
    names.set(deviceId, name);
  };
  return {
    async load() {
      for (const row of (await data.named(settings.maxInMemory)).reverse())
        remember(row.deviceId, row.name);
    },
    nameOf: (deviceId: string) => names.get(deviceId),
    // Los nombres de los demás dispositivos, para avisar si se repite (R9.3).
    othersThan: (deviceId: string) =>
      [...names].filter(([id]) => id !== deviceId).map(([, name]) => name),
    // Pone, cambia o borra (nulo) el nombre, con el aviso (el vínculo lo muestra); la memoria, después
    // de confirmarlo en la base.
    async rename(deviceId: string, name: string | null) {
      await events.transaction(db, async (trx, publish) => {
        await devicesData(trx as never).rename(deviceId, name, clock.now());
        await publish('device.renamed', { deviceId, name });
      });
      remember(deviceId, name);
    },
    // Que se usó: se escribe con la próxima tanda, si todavía no se anotó hoy.
    touch: seen.touch,
    flush: seen.flush,
    // La limpieza diaria: el nombre de un dispositivo que nadie usa en un año se borra (R9.6).
    async cleanUp() {
      const before = new Date(clock.now().getTime() - settings.forgetAfterDays * day);
      for (const deviceId of await data.forgetUnused(before)) names.delete(deviceId);
    },
  };
}

export type DeviceNames = ReturnType<typeof createDeviceNames>;

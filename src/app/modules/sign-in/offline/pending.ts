// Las entradas sin conexión que el servidor todavía no confirmó (15 · R3; diseño de 15, § 5), en
// orden. Salen primero, antes que cualquier otro pedido, al abrir y al volver la red. Cada una se
// borra con cualquier respuesta del servidor salvo «probá después» (sin red, demasiados intentos o
// una versión nueva que actualizar). La firma guardada no sirve para otra cosa: está atada a su id.
import { forget, readStored, store } from '../../../platform/device/storage.ts';
import { createStore } from '../../../platform/store.ts';

const pendingKey = 'offline-pending';

export type Entry = {
  id: string;
  userId: string;
  signedAt: string;
  lastContactAt: string;
  response: Record<string, unknown>;
  proofPublicKey: string;
  // La persona salió de esa sesión sin conexión: se manda igual, para la auditoría (E21).
  ended: boolean;
};

const read = (): Entry[] => readStored<Entry[]>(pendingKey) ?? [];

// Cuántas hay: con alguna, la aplicación vuelve a probar sola aunque se vea el marco.
export const pendingEntries = createStore(read().length);

function save(entries: Entry[]): void {
  if (entries.length > 0) store(pendingKey, entries);
  else forget(pendingKey);
  pendingEntries.set(entries.length);
}

export const entries = read;
export const addEntry = (entry: Entry) => save([...read(), entry]);
export const dropEntry = (id: string) => save(read().filter((entry) => entry.id !== id));
export const endEntry = (id: string) =>
  save(read().map((entry) => (entry.id === id ? { ...entry, ended: true } : entry)));

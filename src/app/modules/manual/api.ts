// Lo que el manual pide (diseño del manual, §§ 4 y 5): archivos fijos de /manual/, nunca de /api, y
// siempre a la red (`no-store`: R6.8, no se guarda en el dispositivo). Solo pide nombres que salen del
// índice o de las constantes de lo compartido. Sin red, «offline»; si el archivo no está (una versión
// vieja después de un despliegue), «missing».
import {
  type Chapter,
  type ChapterEntry,
  type Device,
  type ManualIndex,
  manualFiles,
  type SearchTask,
} from '@ferrebress/shared/contracts/manual';

export type Loaded<T> = { ok: true; data: T } | { ok: false; reason: 'offline' | 'missing' };

const base = '/manual/';

export async function load(name: string): Promise<Response | 'offline' | 'missing'> {
  try {
    const response = await fetch(`${base}${name}`, { cache: 'no-store' });
    return response.ok ? response : 'missing';
  } catch {
    return 'offline';
  }
}

async function loadJson<T>(name: string): Promise<Loaded<T>> {
  const response = await load(name);
  if (typeof response === 'string') return { ok: false, reason: response };
  try {
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, reason: 'missing' };
  }
}

export const manualApi = {
  index: () => loadJson<ManualIndex>(manualFiles.index),
  chapter: (entry: ChapterEntry) => loadJson<Chapter>(manualFiles.chapter(entry.id)),
  search: (device: Device) => loadJson<SearchTask[]>(manualFiles.search(device)),
};

export const mediaUrl = (file: string) => `${base}${manualFiles.media(file)}`;

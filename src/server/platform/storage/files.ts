// Los archivos que se suben, guardados una vez por contenido (su SHA-256): subir dos veces el mismo
// no lo guarda dos veces (08 · E63). Se guardan como flujo, sin tenerlos enteros en memoria, con un
// tope que corta mientras llegan. En la máquina, un volumen (FILES_PATH); en las pruebas, la memoria.
// Un módulo no sabe dónde están: mañana pueden ir a un bucket sin tocarlo.
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, open, readdir, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

export type Stored = { sha256: string; size: number };

export type FileStore = {
  // Guarda lo que llega; si pasa `max` bytes, no guarda nada.
  save(chunks: AsyncIterable<Uint8Array>, max: number): Promise<Stored | 'too-big'>;
  // El archivo, de a partes.
  read(sha256: string): AsyncIterable<Uint8Array>;
  // Dónde está en el disco, para el proceso lector; null en la memoria.
  pathOf(sha256: string): string | null;
  remove(sha256: string): Promise<void>;
  // Los que están guardados desde hace más de una hora, para borrar los que quedaron sin fila: uno
  // más nuevo puede ser de una subida que todavía no creó su fila. De paso borra los temporales de más
  // de una hora, que dejó una subida cortada por un reinicio.
  // `minAgeMs`, para las pruebas. En la memoria no hay subidas a medias: devuelve todos.
  list(minAgeMs?: number): Promise<string[]>;
};

// Lo que tarda como mucho una subida en crear su fila después de guardar el archivo.
const settled = 60 * 60_000;

const hexOnly = /^[0-9a-f]{64}$/;
const checked = (sha256: string) => {
  if (!hexOnly.test(sha256)) throw new Error('no es un SHA-256');
  return sha256;
};

// Cuenta y calcula el resumen mientras pasa cada parte, y corta pasado el tope.
async function* measured(
  chunks: AsyncIterable<Uint8Array>,
  max: number,
  seen: { size: number; hash: ReturnType<typeof createHash> },
): AsyncIterable<Uint8Array> {
  for await (const chunk of chunks) {
    seen.size += chunk.byteLength;
    if (seen.size > max) throw new TooBig();
    seen.hash.update(chunk);
    yield chunk;
  }
}

class TooBig extends Error {}

export function diskFiles(dir: string): FileStore {
  const pathOf = (sha256: string) => join(dir, checked(sha256));
  return {
    async save(chunks, max) {
      await mkdir(join(dir, 'tmp'), { recursive: true });
      const temporary = join(dir, 'tmp', randomUUID());
      const seen = { size: 0, hash: createHash('sha256') };
      const file = await open(temporary, 'wx');
      try {
        for await (const chunk of measured(chunks, max, seen)) await file.write(chunk);
      } catch (error) {
        await file.close();
        await rm(temporary, { force: true });
        if (error instanceof TooBig) return 'too-big';
        throw error;
      }
      await file.close();
      const sha256 = seen.hash.digest('hex');
      await rename(temporary, pathOf(sha256));
      return { sha256, size: seen.size };
    },
    read: (sha256) => createReadStream(pathOf(sha256), { highWaterMark: 1024 * 1024 }),
    pathOf,
    remove: async (sha256) => rm(pathOf(sha256), { force: true }),
    async list(minAgeMs = settled) {
      const before = Date.now() - minAgeMs;
      const temporary = join(dir, 'tmp');
      for (const name of await readdir(temporary).catch(() => []))
        if ((await stat(join(temporary, name))).mtimeMs < before)
          await rm(join(temporary, name), { force: true });
      const names = await readdir(dir).catch(() => []);
      const files = await Promise.all(
        names
          .filter((name) => hexOnly.test(name))
          .map(async (name) => ({ name, info: await stat(join(dir, name)) })),
      );
      return files
        .filter((file) => file.info.isFile() && file.info.mtimeMs < before)
        .map((file) => file.name);
    },
  };
}

export function memoryFiles(): FileStore {
  const files = new Map<string, Uint8Array>();
  return {
    async save(chunks, max) {
      const seen = { size: 0, hash: createHash('sha256') };
      const parts: Uint8Array[] = [];
      try {
        for await (const chunk of measured(chunks, max, seen)) parts.push(chunk);
      } catch (error) {
        if (error instanceof TooBig) return 'too-big';
        throw error;
      }
      const sha256 = seen.hash.digest('hex');
      files.set(sha256, Buffer.concat(parts));
      return { sha256, size: seen.size };
    },
    async *read(sha256) {
      const bytes = files.get(checked(sha256));
      if (bytes) yield bytes;
    },
    pathOf: () => null,
    remove: async (sha256) => {
      files.delete(checked(sha256));
    },
    list: async () => [...files.keys()],
  };
}

export const openFiles = (path: string): FileStore =>
  path === ':memory:' ? memoryFiles() : diskFiles(path);

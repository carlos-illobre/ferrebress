import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diskFiles, type FileStore, memoryFiles, openFiles } from './files.ts';

async function* parts(...texts: string[]) {
  for (const text of texts) yield new TextEncoder().encode(text);
}

async function readAll(store: FileStore, sha256: string) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of store.read(sha256)) chunks.push(chunk);
  return Buffer.concat(chunks).toString();
}

const sha = (text: string) => createHash('sha256').update(text).digest('hex');

for (const [name, make] of [
  ['en el disco', async () => diskFiles(await mkdtemp(join(tmpdir(), 'ferrebress-files-')))],
  ['en la memoria', async () => memoryFiles()],
] as const) {
  describe(`los archivos ${name}`, () => {
    it('08 · E63: se guardan una vez por contenido y se leen igual', async () => {
      const store = await make();
      const first = await store.save(parts('Código;', 'Precio'), 100);
      const again = await store.save(parts('Código;Precio'), 100);
      expect(first).toEqual({ sha256: sha('Código;Precio'), size: 14 });
      expect(again).toEqual(first);
      expect(await readAll(store, sha('Código;Precio'))).toBe('Código;Precio');
      expect(await store.list(-1)).toEqual([sha('Código;Precio')]);
    });

    it('08 · E34: pasado el tope mientras llega, no guarda nada', async () => {
      const store = await make();
      expect(await store.save(parts('12345', '67890'), 8)).toBe('too-big');
      expect(await store.list()).toEqual([]);
    });

    it('se borran, y un nombre que no es un SHA-256 no se acepta', async () => {
      const store = await make();
      const saved = await store.save(parts('x'), 10);
      if (saved === 'too-big') throw new Error('no');
      await store.remove(saved.sha256);
      expect(await store.list()).toEqual([]);
      await expect(store.remove('../../etc/passwd')).rejects.toThrow();
    });
  });
}

describe('el almacén según la configuración', () => {
  it('«:memory:» es la memoria; otra cosa, una carpeta, que no deja archivos de paso', async () => {
    expect(openFiles(':memory:').pathOf(sha('x'))).toBeNull();
    const dir = await mkdtemp(join(tmpdir(), 'ferrebress-files-'));
    const store = openFiles(dir);
    expect(store.pathOf(sha('x'))).toBe(join(dir, sha('x')));
    expect(await store.list()).toEqual([]);
    await store.save(parts('x'), 10);
    await store.save(parts('muy largo'), 2);
    expect(await readdir(join(dir, 'tmp'))).toEqual([]);
  });

  it('un error al leer lo que llega borra el archivo de paso', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ferrebress-files-'));
    async function* broken() {
      yield new Uint8Array([1]);
      throw new Error('se cortó');
    }
    await expect(diskFiles(dir).save(broken(), 10)).rejects.toThrow('se cortó');
    await expect(memoryFiles().save(broken(), 10)).rejects.toThrow('se cortó');
    expect(await readdir(join(dir, 'tmp'))).toEqual([]);
  });

  it('un archivo guardado hace menos de una hora no se lista; un temporal de más de una hora se borra', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ferrebress-files-'));
    const store = diskFiles(dir);
    await store.save(parts('nuevo'), 10);
    expect(await store.list()).toEqual([]);
    const old = new Date(Date.now() - 2 * 60 * 60_000);
    await utimes(join(dir, sha('nuevo')), old, old);
    await mkdir(join(dir, 'tmp'), { recursive: true });
    for (const [name, at] of [
      ['viejo', old],
      ['en-curso', new Date()],
    ] as const) {
      await writeFile(join(dir, 'tmp', name), 'x');
      await utimes(join(dir, 'tmp', name), at, at);
    }
    expect(await store.list()).toEqual([sha('nuevo')]);
    expect(await readdir(join(dir, 'tmp'))).toEqual(['en-curso']);
  });

  it('lo que no está: no se lee nada y una carpeta que no existe no tiene archivos', async () => {
    expect(await readAll(memoryFiles(), sha('nada'))).toBe('');
    expect(await diskFiles(join(tmpdir(), 'ferrebress-no-existe')).list()).toEqual([]);
  });
});

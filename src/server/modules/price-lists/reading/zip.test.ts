// El índice de un ZIP antes de abrirlo (diseño de 08, § 10): las bombas y los que mienten no pasan.
import { describe, expect, it } from 'vitest';
import { zipFits, zipLimits } from './zip.ts';

type Entry = { name: string; data: Buffer; size?: number; local?: number; flags?: number };

// Un ZIP sin comprimir, con lo que declara cada parte a elección de la prueba.
function zipOf(entries: Entry[], { count }: { count?: number } = {}): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const size = entry.size ?? entry.data.length;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(entry.flags ?? 0, 6);
    local.writeUInt32LE(entry.data.length, 18);
    local.writeUInt32LE(entry.local ?? size, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(entry.flags ?? 0, 8);
    central.writeUInt32LE(entry.data.length, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, entry.data);
    centrals.push(central, name);
    offset += 30 + name.length + entry.data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(count ?? entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

const part = (name: string, more: Partial<Entry> = {}): Entry => ({
  name,
  data: Buffer.from('hola'),
  ...more,
});

describe('el índice de un .xlsx', () => {
  it('uno común pasa', () => {
    expect(zipFits(zipOf([part('a.xml'), part('b.xml')]))).toBe(true);
  });

  it('uno que dice que se infla más de 100 veces, o más de 300 MB, no pasa', () => {
    expect(zipFits(zipOf([part('a.xml', { size: 200_000, local: 200_000 })]))).toBe(false);
    expect(zipLimits.totalBytes).toBe(300 * 2 ** 20);
    expect(zipFits(zipOf([part('a.xml', { size: 0xffffffff, local: 0xffffffff })]))).toBe(false);
  });

  it('una cabecera que no coincide con el índice, o una parte sin tamaño que trae datos, no pasa', () => {
    expect(zipFits(zipOf([part('a.xml', { local: 3 })]))).toBe(false);
    expect(zipFits(zipOf([part('a.xml', { flags: 0x08 })]))).toBe(false);
    expect(zipFits(zipOf([part('a.xml', { flags: 0x08, data: Buffer.alloc(0), size: 0 })]))).toBe(
      true,
    );
  });

  it('demasiadas partes, ninguna, o un índice roto o que falta, no pasa', () => {
    const many = Array.from({ length: zipLimits.parts + 1 }, (_, i) =>
      part(`p${i}`, { data: Buffer.alloc(0) }),
    );
    expect(zipFits(zipOf(many))).toBe(false);
    expect(zipFits(zipOf([]))).toBe(false);
    expect(zipFits(zipOf([part('a.xml')], { count: 2 }))).toBe(false);
    expect(zipFits(zipOf([part('a.xml')]).subarray(0, 40))).toBe(false);
    const wrongLocal = zipOf([part('a.xml')]);
    wrongLocal.writeUInt32LE(0, 0);
    expect(zipFits(wrongLocal)).toBe(false);
  });
});

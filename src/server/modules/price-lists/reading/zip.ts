// El índice de un `.xlsx` antes de abrirlo (diseño de 08, § 10; ADR-021): un `.xlsx` es un ZIP, y uno
// armado para hacer daño dice que trae poco y se infla al descomprimirlo. Se mira el índice: cuántas
// partes, que cada una declare su tamaño, que la suma no pase un tope frente al tamaño del archivo y
// que la cabecera de cada parte coincida con el índice. Con el tamaño declarado, SheetJS descomprime
// dentro de ese espacio.

export const zipLimits = { parts: 2000, totalBytes: 300 * 2 ** 20, ratio: 100 };

const endSignature = 0x06054b50;
const centralSignature = 0x02014b50;
const localSignature = 0x04034b50;
const zip64 = 0xffffffff;

export const isZip = (file: Buffer) => file.length >= 4 && file.readUInt32LE(0) === localSignature;

// El final del índice: está en los últimos 22 bytes más el comentario (hasta 64 KB).
function endOf(file: Buffer): number {
  for (let at = file.length - 22; at >= Math.max(0, file.length - 22 - 0xffff); at--)
    if (file.readUInt32LE(at) === endSignature) return at;
  return -1;
}

type Part = { compressed: number; size: number; flags: number; local: number; nameLength: number };

function partsOf(file: Buffer, end: number): Part[] | undefined {
  const count = file.readUInt16LE(end + 10);
  let at = file.readUInt32LE(end + 16);
  const parts: Part[] = [];
  for (let i = 0; i < count; i++) {
    if (at + 46 > file.length || file.readUInt32LE(at) !== centralSignature) return undefined;
    parts.push({
      flags: file.readUInt16LE(at + 8),
      compressed: file.readUInt32LE(at + 20),
      size: file.readUInt32LE(at + 24),
      nameLength: file.readUInt16LE(at + 28),
      local: file.readUInt32LE(at + 42),
    });
    at += 46 + file.readUInt16LE(at + 28) + file.readUInt16LE(at + 30) + file.readUInt16LE(at + 32);
  }
  return parts;
}

// La cabecera de la parte dice lo mismo que el índice; una sin tamaño declarado (bit 3) no trae datos.
function agrees(file: Buffer, part: Part): boolean {
  if (part.local + 30 > file.length || file.readUInt32LE(part.local) !== localSignature)
    return false;
  if (part.flags & 0x08) return part.compressed === 0 && part.size === 0;
  return (
    file.readUInt32LE(part.local + 18) === part.compressed &&
    file.readUInt32LE(part.local + 22) === part.size &&
    file.readUInt16LE(part.local + 26) === part.nameLength
  );
}

// `true` si se puede abrir; si no, el archivo no se toca.
export function zipFits(file: Buffer): boolean {
  const end = endOf(file);
  if (end < 0) return false;
  const parts = partsOf(file, end);
  if (!parts || parts.length === 0 || parts.length > zipLimits.parts) return false;
  if (parts.some((part) => part.size === zip64 || part.compressed === zip64)) return false;
  const total = parts.reduce((sum, part) => sum + part.size, 0);
  if (total > Math.min(zipLimits.totalBytes, zipLimits.ratio * file.length)) return false;
  return parts.every((part) => agrees(file, part));
}

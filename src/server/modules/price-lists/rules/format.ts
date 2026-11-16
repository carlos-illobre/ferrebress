// El formato de un archivo subido (08 · R4.2; diseño de 08, § 3), sin tecnología: la extensión y los
// primeros bytes. Un ejecutable no pasa con ningún nombre; un ZIP solo como `.xlsx` y un archivo de
// Office viejo solo como `.xls`. Lo demás es texto (un CSV, o una tabla con nombre `.xls`): lo decide
// el proceso lector.
import { listExtensions } from '@ferrebress/shared/contracts/price-lists';

const starts = (head: Uint8Array, ...bytes: number[]) => bytes.every((byte, i) => head[i] === byte);

const executable = (head: Uint8Array) =>
  starts(head, 0x4d, 0x5a) || // MZ: Windows
  starts(head, 0x7f, 0x45, 0x4c, 0x46) || // ELF: Linux
  starts(head, 0x23, 0x21) || // #!: un guion
  starts(head, 0xca, 0xfe, 0xba, 0xbe) || // Mach-O universal
  starts(head, 0xcf, 0xfa, 0xed, 0xfe); // Mach-O

export const extensionOf = (name: string): string | undefined =>
  listExtensions.find((extension) => name.toLowerCase().endsWith(extension));

export function formatFits(name: string, head: Uint8Array): boolean {
  const extension = extensionOf(name);
  if (!extension || head.length === 0 || executable(head)) return false;
  if (starts(head, 0x50, 0x4b, 0x03, 0x04)) return extension === '.xlsx';
  if (starts(head, 0xd0, 0xcf, 0x11, 0xe0)) return extension === '.xls';
  return extension !== '.xlsx';
}

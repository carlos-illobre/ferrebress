// Los identificadores nuevos (arquitectura, «Los datos»): UUID v7, que los genera quien crea el
// dato y se ordenan por tiempo, así un índice no se desordena y lo repetido no se duplica.
import { randomBytes } from 'node:crypto';
import type { Clock } from './clock.ts';

export function newId(clock: Clock): string {
  const bytes = randomBytes(16);
  const time = BigInt(clock.now().getTime());
  for (let i = 0; i < 6; i++) bytes[i] = Number((time >> BigInt(8 * (5 - i))) & 0xffn);
  bytes[6] = 0x70 | ((bytes[6] as number) & 0x0f);
  bytes[8] = 0x80 | ((bytes[8] as number) & 0x3f);
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

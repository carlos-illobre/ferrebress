// Si la persona puede, y la huella de sus permisos (02 · R7.7, R7.8). Sin la lista de permisos: el
// marco y el arranque de la aplicación los usan sin bajarla.
import type { PermissionId } from './permissions.ts';

// Si la persona puede: la usan el marco y las pantallas para mostrar solo lo permitido (R7.7).
export const can = (
  person: { permissions: readonly string[] } | undefined,
  id: PermissionId,
): boolean => person?.permissions.includes(id) ?? false;

// La huella de los permisos de alguien (8 letras): la lleva la cabecera de cada respuesta, y la
// aplicación la compara con la de la persona que tiene para saber que cambiaron (R7.8). FNV-1a.
export function permissionsHash(ids: readonly string[]): string {
  let hash = 0x811c9dc5;
  for (const char of [...ids].sort().join(',')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

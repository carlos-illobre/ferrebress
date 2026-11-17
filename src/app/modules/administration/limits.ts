// Lo que otros módulos necesitan saber de los ajustes para todos: el tamaño máximo de una lista
// (R8.3), para rechazar un archivo antes de subirlo (08 · R4.2). Sin poder traerlo, no se sabe, y el
// servidor lo rechaza igual.
import { administrationApi } from './api.ts';

export async function listMaxMb(): Promise<number | undefined> {
  const result = await administrationApi.settings();
  return result.ok ? result.data.settings.maxFileMb.value : undefined;
}

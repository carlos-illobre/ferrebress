// Juntar los cambios del espejo antes de mandarlos por el servidor (diseño de 03, § 4.3): lo de los
// mismos 150 ms sale junto y, de cada clave, solo el último. Escribir «tornillo» sale en dos o tres
// pedidos, no en ocho. Por el directo no hace falta: no se paga.
import type { Patch } from './registry.ts';

export function coalesce(send: (patches: Patch[]) => void, ms: number) {
  const waiting = new Map<string, Patch>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    timer = undefined;
    const patches = [...waiting.values()];
    waiting.clear();
    send(patches);
  };
  return {
    send(patches: Patch[]): void {
      for (const patch of patches) {
        // La clave vuelve al final: el orden es el del último cambio de cada una.
        waiting.delete(patch.k);
        waiting.set(patch.k, patch);
      }
      timer ??= setTimeout(flush, ms);
    },
    // Al desconectar el espejo, lo que esperaba ya no sale.
    stop(): void {
      clearTimeout(timer);
      waiting.clear();
    },
  };
}

// Si el detalle del vínculo está abierto: lo abren los indicadores y lo cierra el detalle.
import { createStore, useStore } from '../../../platform/store.ts';
import { linkRuntime } from '../current.ts';

export const detailOpen = createStore(false);

// Leer un código para vincular, en el celular: con la cámara (sin código) o con el código que trajo la
// dirección /pair (la cámara del teléfono, E02).
export const reading = createStore<{ code?: string } | undefined>(undefined);

// La confirmación de desvincular (R5.3): la abre el detalle o el aviso de R1.5.
export const unpairAsked = createStore(false);

// El detalle abierto o cerrado, para los dos indicadores (03 · R4.2).
export function useDetailToggle() {
  const open = useStore(detailOpen);
  return { open, toggle: () => detailOpen.set(!open) };
}

// Lo que se abre encima del marco (el detalle, leer el código, desvincular), con el vínculo ya
// llegado: recién ahí se baja.
export function useOverShown(): boolean {
  const runtime = useStore(linkRuntime);
  const open = useStore(detailOpen);
  const read = useStore(reading);
  const asked = useStore(unpairAsked);
  return !!runtime && (open || !!read || asked);
}

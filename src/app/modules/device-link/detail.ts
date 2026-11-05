// Si el detalle del vínculo está abierto: lo abren los indicadores y lo cierra el detalle.
import { createStore } from '../../platform/store.ts';

export const detailOpen = createStore(false);

// Leer un código para vincular, en el celular: con la cámara (sin código) o con el código que trajo la
// dirección /pair (la cámara del teléfono, E02).
export const reading = createStore<{ code?: string } | undefined>(undefined);

// La confirmación de desvincular (R5.3): la abre el detalle o el aviso de R1.5.
export const unpairAsked = createStore(false);

// Si el detalle del vínculo está abierto: lo abren los indicadores y lo cierra el detalle.
import { createStore } from '../../platform/store.ts';

export const detailOpen = createStore(false);

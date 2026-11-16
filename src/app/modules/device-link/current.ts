// El vínculo de esta pestaña mientras la aplicación está abierta: lo que leen las pantallas.
import { createStore } from '../../platform/store.ts';
import type { Runtime } from './runtime.ts';
import type { Strip } from './strip.ts';

export const linkRuntime = createStore<Runtime | undefined>(undefined);

// La tira del día de quien tiene la sesión (R4.4), para el detalle. Va envuelta: una función suelta en
// un store se confundiría con la que actualiza el estado.
export const linkStrip = createStore<{ of?: () => Strip | undefined }>({});

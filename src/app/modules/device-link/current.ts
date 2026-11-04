// El vínculo de esta pestaña mientras la aplicación está abierta: lo que leen las pantallas.
import type { ComponentType } from 'preact';
import { createStore } from '../../platform/store.ts';
import type { Runtime } from './runtime.ts';
import type { Strip } from './strip.ts';

export const linkRuntime = createStore<Runtime | undefined>(undefined);

// La tira del día de quien tiene la sesión (R4.4), para el detalle. Envuelta, como `linkOver`.
export const linkStrip = createStore<{ of?: () => Strip | undefined }>({});

// Lo que abre el indicador (el detalle): llega con el vínculo. Va envuelto: un componente suelto en un
// store se confundiría con la función que actualiza el estado.
export const linkOver = createStore<{ Over: ComponentType } | undefined>(undefined);

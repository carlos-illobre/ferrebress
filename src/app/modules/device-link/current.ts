// El vínculo de esta pestaña mientras la aplicación está abierta: lo que leen las pantallas.
import { createStore } from '../../platform/store.ts';
import type { Runtime } from './runtime.ts';

export const linkRuntime = createStore<Runtime | undefined>(undefined);

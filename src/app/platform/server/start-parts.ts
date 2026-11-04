// Lo que cada módulo recibió en el último `/api/start` (diseño de 03, § 10.1), por su nombre:
// `undefined` mientras no contestó. Cada módulo lee y valida lo suyo; el que abre la aplicación lo
// guarda acá sin saber qué trae.
import { createStore } from '../store.ts';

export const startParts = createStore<Record<string, unknown> | undefined>(undefined);

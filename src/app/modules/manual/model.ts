// Lo que las vistas usan de este módulo (ADR-019): sus modelos, sus textos y las cuentas que
// muestran. Las vistas no importan nada más del módulo; index.ts es lo que va en el arranque.
export { mediaUrl } from './files/api.ts';
export { type Captures, useCaptures } from './files/media.ts';
export { type Folds, soonId, useFolds } from './folds.ts';
export { manualIcons } from './icons.ts';
export { type Back, backOf } from './place/back.ts';
export { marks, maxQuery, minQuery } from './search.ts';
export { taskAfter, tasksOf } from './state.ts';
export { texts } from './texts.ts';
export { type ManualScreen, useManualScreen } from './useManualScreen.ts';
export type { View } from './view.ts';

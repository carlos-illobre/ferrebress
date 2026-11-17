// Lo que las vistas usan de Anomalías (ADR-019): el modelo de su pantalla, sus textos y lo que se dice
// de cada una. Las vistas no importan nada más del módulo.
export type { AnomalyView } from '@ferrebress/shared/contracts/anomalies';
export { type Anomalies, useAnomalies } from './anomalies.ts';
export type { Rows } from './rows.ts';
export { cellsOf, linesOf, skipText } from './summary.ts';
export { texts } from './texts.ts';

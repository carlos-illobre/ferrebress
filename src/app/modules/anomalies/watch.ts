// Cuántas anomalías hay abiertas, en el menú (06 · R9.5): llega con cada respuesta en la letra `a` de la
// cabecera, solo para quien tiene el permiso, sin aviso en vivo. Sin la letra, no hay número.
import { openAnomaliesField } from '@ferrebress/shared/contracts/anomalies';
import { onField } from '../../platform/server/fields.ts';
import { setMenuCount } from '../frame/index.ts';

export const watchAnomalies = () =>
  onField(openAnomaliesField, (value) => setMenuCount('anomalies', Number(value ?? 0) || 0));

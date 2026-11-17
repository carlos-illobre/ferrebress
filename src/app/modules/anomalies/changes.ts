// Marcar una anomalía revisada, con su nota, o volver a abrirla (06 · R9.4, E48, E49). Si otra persona
// la cambió antes (o se cerró sola), el servidor dice cómo está y se muestra así.
import type { AnomalyChanged, AnomalyView } from '@ferrebress/shared/contracts/anomalies';
import type { ApiResult } from '../../platform/server/api.ts';
import { notify } from '../../platform/view/notify.ts';
import { anomaliesApi } from './api.ts';
import { texts } from './texts.ts';

export type Put = (anomaly: AnomalyView) => void;

async function settle(result: ApiResult<AnomalyView>, put: Put, done: string) {
  if (result.ok) {
    put(result.data);
    return notify(done, 'check');
  }
  if (result.error === 'anomaly-changed') {
    put((result as unknown as AnomalyChanged).anomaly);
    return notify(texts.changed, 'users');
  }
  notify(texts.failed, 'triangle-alert');
}

export const review = async (anomaly: AnomalyView, note: string, put: Put) =>
  settle(await anomaliesApi.review(anomaly.id, note.trim() || undefined), put, texts.reviewed);

export const reopen = async (anomaly: AnomalyView, put: Put) =>
  settle(await anomaliesApi.reopen(anomaly.id), put, texts.reopened);

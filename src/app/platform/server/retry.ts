// Cuánto esperar cuando el servidor dice que se pidió demasiado (429): lo que dice su
// `retryAfterSeconds`, como mínimo un segundo; si no lo dice, un minuto.
import { platformSettings } from '../settings.ts';

export const retryAfterMs = (body: { retryAfterSeconds?: unknown }): number =>
  Math.max(1000, Number(body.retryAfterSeconds) * 1000 || platformSettings.retryAfterMs);

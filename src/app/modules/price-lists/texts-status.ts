// Cómo se dice el estado de una lista (08 · R4.9), igual en todas las pantallas que lo muestran.
import type { ListStatus } from '@ferrebress/shared/contracts/price-lists';

export const listStatusTexts: Record<ListStatus, string> = {
  queued: 'Esperando su turno para leerse',
  reading: 'Leyéndose',
  pending: 'Leída, sin aplicar',
  applying: 'Aplicándose',
  applied: 'Aplicada',
  discarded: 'Descartada',
  unreadable: 'No se pudo leer',
};

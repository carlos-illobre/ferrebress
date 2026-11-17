// Cómo se dice el estado de una lista (08 · R4.9), igual en todas las pantallas que lo muestran.
import type { ListReason, ListStatus, SkipReason } from '@ferrebress/shared/contracts/price-lists';

export const listStatusTexts: Record<ListStatus, string> = {
  queued: 'Esperando su turno para leerse',
  reading: 'Leyéndose',
  pending: 'Leída, sin aplicar',
  applying: 'Aplicándose',
  applied: 'Aplicada',
  discarded: 'Descartada',
  unreadable: 'No se pudo leer',
};

// Por qué no se pudo leer o por qué se descartó una lista (R4.6, R4.8, R4.11).
export const listReasonTexts: Record<ListReason, string> = {
  'too-big': 'El archivo es demasiado grande por dentro',
  damaged: 'El archivo está dañado o no es una planilla',
  empty: 'La planilla está vacía',
  'no-reader': 'Ningún lector entiende esta planilla',
  'auto-unsure': 'El lector automático no está seguro de qué columna es qué',
  'reader-failed': 'El lector falló al leerla',
  crashed: 'La lectura se cortó dos veces',
  cancelled: 'Se canceló',
  replaced: 'Se subió otra lista del mismo proveedor',
  'supplier-inactive': 'El proveedor está dado de baja',
  'by-hand': 'Se descartó a mano',
  interrupted: 'Se cortó mientras se aplicaba',
  'apply-failed': 'No se pudo aplicar',
};

// Por qué se salteó una fila (R5.4).
export const skipReasonTexts: Record<SkipReason, string> = {
  'no-code': 'sin código',
  'no-description': 'sin descripción',
  'no-price': 'sin precio',
  'zero-price': 'con precio cero',
  'not-a-number': 'con un precio que no es un número',
  'repeated-code': 'con el código repetido',
  'other-currency': 'en otra moneda',
};

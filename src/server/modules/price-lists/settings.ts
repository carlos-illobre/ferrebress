// Lo fijo de las listas de precios (diseño de 08, § 7), con nombre y en un solo lugar.
const minute = 60_000;

export const priceListsSettings = {
  // Los cambios de una sesión en los proveedores y en las listas: pantallas que se tocan poco.
  changes: { max: 60, windowMs: minute },
  // Subir: 10 listas por minuto por persona (diseño de 08, § 10).
  uploads: { max: 10, windowMs: minute },
  // Sin datos por este tiempo, la subida se corta (las pruebas lo bajan).
  uploadIdleMs: 30_000,
  // Un rechazo repetido se anota una vez por ventana.
  throttledAudit: { max: 1, windowMs: minute },
  // Recalcular, poner costos y dar de baja, de a tandas de esta cantidad de filas.
  batch: 1000,
  // El tope de cada lector por bloque (R5.10): memoria, pila y tiempo.
  reader: { memoryBytes: 64 * 2 ** 20, stackBytes: 2 ** 20, timeMs: 5000 },
  // Los procesos lectores (ADR-021): cuántos, su tope de memoria y cuánto pueden callar.
  pool: { processes: 2, memoryMb: 384, heapMb: 320, stallMs: 60_000 },
};

// Si la pantalla es angosta (00 · R3): una vista lo usa para elegir cuánto mostrar (por ejemplo,
// cuántas semanas entran), sin cambiar ninguna regla. Parte del contrato de las vistas (ADR-019).
export { isNarrow, useNarrow } from '../narrow.ts';

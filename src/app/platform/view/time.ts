// Cómo se muestran las fechas y las horas, con el formato que eligió cada dispositivo (04 · R3).
// Parte del contrato de las vistas (ADR-019).

// La hora del servidor, para mostrar «ahora» igual en todos los dispositivos.
export { serverNow } from '../server/clock.ts';
export {
  dayMonthOf,
  formatHour,
  formatHourOfDay,
  formatTime,
  formatTimeAs,
  nowMs,
  sinceOf,
  type TimeFormat,
} from '../time.ts';

// Los tiempos y topes del vínculo en la aplicación (diseño de 03, § 7, § 8 y § 15): todos con nombre,
// en un lugar. Los del servidor, en su `settings.ts`.
const second = 1000;
const minute = 60 * second;

export const deviceLinkSettings = {
  // La confirmación del directo vale 4 minutos (R2.6); sin internet, la última buena vale hasta 30
  // minutos sin poder confirmar (R3.4).
  confirm: { maxAgeMs: 4 * minute, offlineMs: 30 * minute },
  // Un `hello` o un `resume` del otro pide una confirmación de menos de 30 s antes de la foto (§ 7.1).
  freshMs: 30 * second,
  // El directo dormido se conserva 5 minutos (E22); la foto espera el saludo del otro hasta 5 s; el
  // celular que se fijó y no encontró a la computadora sigue escuchando 30 s (R3.5): al vincular o al
  // reconectar los dos se enteran casi a la vez, y si el celular se fija un instante antes de que la
  // computadora escuche, sin esta espera no se encontrarían hasta el próximo pedido de alguno.
  runtime: { dormantMs: 5 * minute, helloWaitMs: 5 * second, peekMs: 30 * second },
  // El diario: las últimas 300 anotaciones, guardadas cada 10 s si cambió (§ 15.1).
  journal: { key: 'device-link.journal', size: 300, flushMs: 10 * second },
  // Cuánto se ve el tilde del código leído antes de volver al detalle.
  doneMs: 900,
  // Cada cuánto se redibuja la tira del día con el detalle abierto.
  todayEveryMs: minute,
};

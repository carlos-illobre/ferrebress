// Los tiempos y topes de «Quién hizo qué» en el servidor: todos con nombre, en un lugar.
const second = 1000;
const minute = 60 * second;

export const auditLogSettings = {
  // Las consultas por persona, y un rechazo repetido se anota una vez por ventana.
  reads: { max: 60, windowMs: minute },
  throttledAudit: { max: 1, windowMs: minute },
  // Lo que una pantalla pide sola (X-Auto), por sesión y aparte de lo que se pide al tocar (diseño de
  // 05, § 7.1): varias pestañas prendidas no dejan sin respuesta a un toque.
  autoReads: { max: 30, windowMs: minute },
  // Con más que esto en un día, la tira va de a una raya por minuto y la cinta no se abre (R4.9, R4.11).
  dayLimit: 2_000,
  // «Actualizar solo» (R4.6): el aviso sale como mucho una vez cada 5 s, y «n nuevas» cuenta hasta 100.
  live: { everyMs: 5 * second },
  newOnesMax: 100,
  // Cuántas sesiones recuerda que abrieron Quién hizo qué a mano; pasado, empieza de cero.
  openedMemory: 10_000,
};

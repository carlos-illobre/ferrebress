// Los tiempos y topes de «Quién hizo qué» en el servidor: todos con nombre, en un lugar.
const minute = 60_000;

export const auditLogSettings = {
  // Las consultas por sesión, y un rechazo repetido se anota una vez por ventana.
  reads: { max: 60, windowMs: minute },
  throttledAudit: { max: 1, windowMs: minute },
  // Con más que esto en un día, la tira va de a una raya por minuto y la cinta no se abre (R4.9, R4.11).
  dayLimit: 2_000,
};

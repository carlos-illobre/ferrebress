// Los topes de las anomalías, con nombre y en un solo lugar.
const minute = 60_000;

export const anomaliesSettings = {
  // Marcar o volver a abrir, por sesión: una pantalla que se toca poco.
  changes: { max: 30, windowMs: minute },
  // Un rechazo repetido se anota una vez por ventana.
  throttledAudit: { max: 1, windowMs: minute },
};

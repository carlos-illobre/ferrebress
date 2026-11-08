// Los topes de Administración (diseño de 06, § 8), con nombre y en un solo lugar.
const minute = 60_000;

export const administrationSettings = {
  // Los cambios de una sesión: una pantalla que se toca poco.
  changes: { max: 30, windowMs: minute },
  // Un rechazo repetido se anota una vez por ventana.
  throttledAudit: { max: 1, windowMs: minute },
};

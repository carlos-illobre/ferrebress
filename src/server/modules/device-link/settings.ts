// Los tiempos y topes del vínculo (diseño de 03, § 10.2 y § 18): todos con nombre, en un lugar.
const minute = 60_000;

export const deviceLinkSettings = {
  // Vence a los 30 días sin espejar (R2.2); cuando exista Administración, lo fija un Administrador.
  pairingDays: 30,
  // El código del QR de vincular (R1.3) y el boleto de reemplazar (R1.4).
  codeTtlMs: minute,
  ticketTtlMs: 2 * minute,
  // La última vez que espejaron se escribe por tandas.
  flushMirroredEveryMs: minute,
  sdpMaxBytes: 8 * 1024,
  limits: {
    read: { max: 10, windowMs: minute },
    signal: { max: 30, windowMs: minute },
    relay: { max: 600, windowMs: minute },
    check: { max: 60, windowMs: minute },
    report: { max: 10, windowMs: 60 * minute },
  },
  // Un rechazo repetido se anota una vez por ventana.
  throttledAudit: { max: 1, windowMs: minute },
};

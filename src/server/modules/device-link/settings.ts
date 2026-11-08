// Los tiempos y topes del vínculo (diseño de 03, § 10.2 y § 18): todos con nombre, en un lugar.
const minute = 60_000;

export const deviceLinkSettings = {
  // El código del QR de vincular (R1.3) y el boleto de reemplazar (R1.4).
  codeTtlMs: minute,
  ticketTtlMs: 2 * minute,
  // Los boletos guardados a la vez, de todos (uno por sesión).
  ticketsMax: 10_000,
  // La última vez que espejaron se escribe por tandas.
  flushMirroredEveryMs: minute,
  sdpMaxBytes: 8 * 1024,
  limits: {
    read: { max: 10, windowMs: minute },
    signal: { max: 30, windowMs: minute },
    relay: { max: 600, windowMs: minute },
    // Lo que pasa por el respaldo, en KB: 1 MB por minuto (§ 10.2).
    relayKb: { max: 1024, windowMs: minute },
    check: { max: 60, windowMs: minute },
    report: { max: 10, windowMs: 60 * minute },
  },
  // Un rechazo repetido se anota una vez por ventana.
  throttledAudit: { max: 1, windowMs: minute },
};

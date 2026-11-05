// Los tiempos de «Quién hizo qué» en la aplicación: todos con nombre, en un lugar.
export const auditLogSettings = {
  // La cinta del día deja 15 minutos de aire antes de la primera acción y después de la última.
  tapeMarginMs: 15 * 60_000,
  // «Actualizar solo» (R4.6; diseño de 05, § 7.2): como mucho una puesta al día cada 5 s; arriba de todo
  // es a menos de 8 px del principio; lo que entra se marca 1,5 s; el tema se suelta 10 s después de
  // apagarlo, así prender y apagar seguido no rehace el canal.
  live: { everyMs: 5_000, topPx: 8, markMs: 1_500, releaseMs: 10_000 },
};

// Lo que es igual en todos los ambientes (diseño de 01, § 11).
export const platformSettings = {
  bodyLimitBytes: 64 * 1024,
  // La versión del contrato más vieja que el servidor todavía entiende (00 · R5.5).
  minContractVersion: 1,
  // Los pedidos rechazados se anotan una vez por ventana y por clave (revisión de seguridad, 19).
  rejectedAuditWindow: { max: 1, windowMs: 60_000 },
};

// Lo de entrar que es igual en todos los ambientes (diseño de 01, § 8 y § 11): los tiempos de la
// sesión (hasta que existan en Administración), los plazos de lo que vive en memoria y los
// límites de intentos.
const minute = 60_000;
const hour = 60 * minute;

export const signInSettings = {
  session: { idleMs: 60 * minute, maxMs: 8 * hour },
  // Cada cuánto se escriben juntos los últimos usos, y cuánto se guardan las sesiones cerradas.
  lastUsedFlushMs: minute,
  closedRetentionMs: 30 * 24 * hour,
  cleanupEveryMs: 24 * hour,
  nonce: { ttlMs: 10 * minute, maxTotal: 1_000, maxPerOwner: 10 },
  challenge: { ttlMs: 5 * minute, maxTotal: 1_000, maxPerOwner: 10 },
  limits: {
    // Por dispositivo y por dirección de internet (R2.9).
    google: { max: 10, windowMs: minute },
    passkey: { max: 20, windowMs: minute },
    // Por cuenta y por forma de entrar, solo los fallos que prueban algo de esa cuenta (R2.10).
    failedPerAccount: { max: 20, windowMs: hour },
    // Los pedidos sin sesión, por dirección (diseño de 01, § 8).
    start: { max: 30, windowMs: minute },
    // Un rechazo por límite se anota una vez por ventana (revisión de seguridad, punto 19).
    throttledAudit: { max: 1, windowMs: minute },
  },
};

// Vincular la huella solo en los minutos siguientes a haber entrado con Google (diseño de 01, § 5).
export const linkPasskeyWithinMs = 5 * minute;

// Entrar a la computadora con el celular (R2.5, R2.7; diseño de 01, § 5).
export const codeSettings = {
  codeTtlMs: minute,
  // Cuánto espera la computadora la huella después de leído el código; más si el celular
  // primero tiene que entrar.
  holdMs: 2 * minute,
  holdWithSignInMs: 5 * minute,
  permitTtlMs: 30_000,
  maxScreens: 100,
  maxScreensPerIp: 3,
  openPerIp: { max: 10, windowMs: minute },
  readPerIp: { max: 10, windowMs: minute },
};

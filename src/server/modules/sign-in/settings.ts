// Lo de entrar que es igual en todos los ambientes (diseño de 01, § 8 y § 11): los tiempos de la
// sesión (hasta que existan en Administración), los plazos de lo que vive en memoria y los
// límites de intentos.
import { offlineWindowHours } from '@ferrebress/shared/contracts/offline-sign-in';
import { codeSeconds, googleNonceMinutes } from '@ferrebress/shared/contracts/sign-in';

const minute = 60_000;
const hour = 60 * minute;

export const signInSettings = {
  session: { idleMs: 60 * minute, maxMs: 8 * hour },
  // Cada cuánto se escriben juntos los últimos usos, y cuánto se guardan las sesiones cerradas.
  lastUsedFlushMs: minute,
  closedRetentionMs: 30 * 24 * hour,
  cleanupEveryMs: 24 * hour,
  // Cada carga de la entrada pide uno: en el local todos salen por la misma dirección, así que el
  // tope por dirección es alto y, al llegar, se descarta el más viejo en lugar de negarse.
  nonce: {
    ttlMs: googleNonceMinutes * minute,
    maxTotal: 100_000,
    maxPerOwner: 100,
    replaceOldest: true,
  },
  challenge: { ttlMs: 5 * minute, maxTotal: 100_000, maxPerOwner: 10 },
  // El `nonce` que firma la llave del dispositivo al entrar (diseño de 01, § 6): por dirección, como el
  // de Google.
  deviceNonce: { ttlMs: 2 * minute, maxTotal: 100_000, maxPerOwner: 100, replaceOldest: true },
  limits: {
    // Los cambios de acceso desde Usuarios: el mismo límite por sesión que las personas (02, § 9).
    accessChanges: { max: 60, windowMs: minute },
    // Por dispositivo y por dirección de internet (R2.9).
    google: { max: 10, windowMs: minute },
    passkey: { max: 20, windowMs: minute },
    // Por cuenta y por forma de entrar, solo los fallos que prueban algo de esa cuenta (R2.10).
    failedPerAccount: { max: 20, windowMs: hour },
    // Los pedidos sin sesión, por dirección (diseño de 01, § 8): /api/start y las salidas pendientes.
    start: { max: 30, windowMs: minute },
    // Las cookies que no son de ninguna sesión, por dirección: cada una cuesta una consulta (02, § 9).
    unknownSession: { max: 30, windowMs: minute },
    // Un rechazo por límite se anota una vez por ventana (revisión de seguridad, punto 19).
    throttledAudit: { max: 1, windowMs: minute },
  },
  // El nombre de los dispositivos (04 · R9; diseño de 04b, § 2 y § 3): cuántos en memoria, a cuánto
  // sin uso se borran y cuántas veces por hora se puede cambiar desde una sesión.
  devices: {
    maxInMemory: 1000,
    forgetAfterDays: 365,
    renames: { max: 10, windowMs: hour },
  },
  // Entrar sin conexión (15 · R2.2; diseño de 15, § 4).
  offline: {
    // Cuánto se puede entrar sin conexión desde el último contacto con sesión (15 · R2.2).
    windowMs: offlineWindowHours * hour,
    // El último uso de las sesiones se escribe por tandas: un poco de margen.
    marginMs: 5 * minute,
    // Una entrada sin conexión se guarda 30 días; una firma de más de 29 días, o de más de un día en
    // el futuro (un reloj mal puesto), no se acepta.
    retentionMs: 30 * 24 * hour,
    maxAgeMs: 29 * 24 * hour,
    maxAheadMs: 24 * hour,
  },
};

// Vincular la huella solo en los minutos siguientes a haber entrado con Google (diseño de 01, § 5).
export const linkPasskeyWithinMs = 5 * minute;

// Entrar a la computadora con el celular (R2.5, R2.7; diseño de 01, § 5).
export const codeSettings = {
  codeTtlMs: codeSeconds * 1000,
  // Cuánto espera la computadora la huella después de leído el código, con o sin sesión en el
  // celular: corto, así nadie en la misma red la deja esperando (revisión de seguridad, 35).
  holdMs: 2 * minute,
  permitTtlMs: 30_000,
  // Una pantalla que no abre su canal en este tiempo se libera sola (revisión de seguridad, 25).
  listenWithinMs: 30_000,
  maxScreens: 1_000,
  maxScreensPerIp: 3,
  openPerIp: { max: 10, windowMs: minute },
  // Recargar la entrada o volver a su pestaña reemplaza la pantalla de esa pestaña: no ocupa más
  // lugar, pero igual tiene un tope, más alto que el de pantallas nuevas.
  reopenPerIp: { max: 60, windowMs: minute },
  readPerIp: { max: 10, windowMs: minute },
};

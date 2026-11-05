// Lo del vínculo que no es un esquema (diseño de 03, § 9): quién es cada uno, cómo lo ve un dispositivo
// y la cabecera de las escrituras. Aparte de los esquemas de `device-link.ts`, así la aplicación lo usa
// sin bajar los esquemas de las rutas.

// La cabecera con que una escritura dice con qué vínculo se hizo, mientras se espeja (§ 7.2).
export const pairingHeaderName = 'X-Pairing';

// Lo que no es una escritura del espejo y no lleva `X-Pairing`: entrar y salir, el canal y el propio
// vínculo. Salir, desvincular o desconectar tienen que andar aunque el vínculo ya haya terminado.
const outsideMirror = ['/api/sign-in', '/api/sign-out', '/api/realtime', '/api/device-link'];
export const isMirroredWrite = (path: string): boolean =>
  !outsideMirror.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

// Quién es cada uno en el vínculo: la computadora ofrece y manda al conectarse (R6.3).
export const sides = ['phone', 'computer'] as const;
export type Side = (typeof sides)[number];

// El vínculo como lo ve un dispositivo: el suyo, del otro solo el nombre (lista cerrada del servidor).
// Las horas, en milisegundos desde 1970, del reloj del servidor.
export type PairingView = {
  id: string;
  side: Side;
  other: { label: string };
  since: number;
  // La última vez que estuvieron conectados en espejo: vence a los 30 días sin uso (R2.2).
  lastMirrored: number;
  // Cuándo vence si no se espeja antes, y de cuántos días es el plazo (R2.2: hoy, 30).
  expiresAt: number;
  lastsDays: number;
  paused: boolean;
};

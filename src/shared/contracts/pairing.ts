// Lo del vínculo que no es un esquema (diseño de 03, § 9): quién es cada uno, cómo lo ve un dispositivo
// y la cabecera de las escrituras. Aparte de los esquemas de `device-link.ts`, así la aplicación lo usa
// sin bajar los esquemas de las rutas.

// La cabecera con que una escritura dice con qué vínculo se hizo, mientras se espeja (§ 7.2).
export const pairingHeaderName = 'X-Pairing';

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
  paused: boolean;
};

// La forma de lo que entra y sale de las rutas del vínculo entre el celular y la computadora (diseño
// de 03, § 10), con sus largos máximos. La usan el servidor para validar y la aplicación para armar
// los pedidos y leer las respuestas. El protocolo entre los dos dispositivos (lo que viaja por el
// directo o por el servidor) no está acá: es del módulo, que lo valida en `wire.ts`.
import * as z from 'zod/mini';

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

// Un intento de presentarse: 8 hexadecimales que juntan lo del celular, la computadora y el servidor
// en el diario y el registro (§ 15).
const attempt = z.string().check(z.regex(/^[0-9a-f]{8}$/));

// El código del QR de vincular: 128 bits en base64url.
export const pairingCode = z.string().check(z.regex(/^[A-Za-z0-9_-]{22}$/));

export const readCodeBody = z.strictObject({ code: pairingCode });

// Lo que contesta leer un código: ya vinculados, o qué se reemplazaría si se acepta (R1.4).
export type ReadCodeResponse =
  | { pairing: PairingView }
  | { ticket: string; replaces: { phone?: string; computer?: true } };

export const acceptBody = z.strictObject({
  ticket: z.string().check(z.regex(/^[A-Za-z0-9_-]{22}$/)),
});

// La oferta o la respuesta de WebRTC, ya filtrada por quien la manda (§ 4.2).
export const signalBody = z.strictObject({
  attempt,
  kind: z.enum(['offer', 'answer']),
  sdp: z.string().check(z.maxLength(8 * 1024)),
});

// Mensajes que el servidor pasa sin abrirlos: el respaldo cuando no hay directo (§ 4.3).
export const relayBody = z.strictObject({
  messages: z.array(z.unknown()).check(z.minLength(1), z.maxLength(100)),
});

// Por qué no se logró el directo, en números y listas cerradas: sin direcciones ni textos libres.
export const reportBody = z.strictObject({
  attempt,
  outcome: z.enum(['direct-failed', 'probe-failed', 'lost']),
  ice: z.strictObject({
    host: z.int().check(z.minimum(0), z.maximum(50)),
    mdns: z.int().check(z.minimum(0), z.maximum(50)),
    pairs: z.int().check(z.minimum(0), z.maximum(50)),
    state: z.enum([
      'new',
      'checking',
      'connected',
      'completed',
      'failed',
      'disconnected',
      'closed',
    ]),
  }),
});

// Lo que contesta la confirmación del vínculo (§ 7): el vínculo de ahora, si hay, y si el otro lado
// de esta conexión sigue en regla.
export type CheckResponse = { pairing?: PairingView; peer?: 'ok' | 'gone' };

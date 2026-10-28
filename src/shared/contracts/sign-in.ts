// La forma de lo que entra y sale de las rutas de entrar (diseño de 01, § 4), con largos máximos
// para cada campo (revisión de seguridad, punto 7). La usan el servidor para validar y la
// aplicación para armar los pedidos.
import * as z from 'zod/mini';
import type { Environment } from './server-header.ts';

const base64url = (max: number) =>
  z.string().check(z.minLength(1), z.maxLength(max), z.regex(/^[A-Za-z0-9_-]+$/));

export const googleSignInBody = z.object({
  credential: z.string().check(z.minLength(1), z.maxLength(4096)),
  proofPublicKey: base64url(256),
});

// La salida pendiente lleva la hora en que se tocó «Salir», según el dispositivo, para la auditoría.
export const signOutBody = z.object({
  pending: z.optional(
    z.object({
      sessionId: z.uuid(),
      signature: base64url(200),
      // Milisegundos desde 1970, dentro de lo que una fecha puede ser.
      tappedAt: z.optional(z.int().check(z.minimum(0), z.maximum(8.64e15))),
    }),
  ),
});

export type Person = { userId: string; name: string; email: string; role: string };

export type StartResponse = {
  environment: Environment;
  version: string;
  googleClientId: string;
  // El script del botón de Google; en las pruebas de punta a punta, uno de prueba.
  googleScriptUrl: string;
  googleNonce?: string;
  person?: Person;
};

export type SignInResponse = { person: Person; sessionId: string; offerPasskey: boolean };

// Lo que devuelve el navegador al crear o usar una huella; su forma la valida el servidor.
const webAuthnResponse = z.record(z.string(), z.unknown());

export const linkPasskeyBody = z.object({ response: webAuthnResponse });

export const passkeySignInBody = z.object({
  response: webAuthnResponse,
  proofPublicKey: base64url(256),
});

export type PasskeySignInBody = z.infer<typeof passkeySignInBody>;

// Entrar a la computadora con el celular (diseño de 01, § 5).
export const readCodeBody = z.object({ code: base64url(32) });

export const approveCodeBody = z.object({
  secret: base64url(64),
  // La huella ya vinculada, o una que se vincula en ese momento (R2.7).
  kind: z.enum(['assertion', 'registration']),
  response: webAuthnResponse,
  proofPublicKey: z.optional(base64url(256)),
});

export const cancelCodeBody = z.object({ secret: base64url(64) });

export const claimCodeBody = z.object({ permit: base64url(64), proofPublicKey: base64url(256) });

export type ReadCodeResponse = {
  secret: string;
  computer: { label: string };
  holdSeconds: number;
  authentication: unknown;
  // Solo si el celular entró con Google hace poco y todavía no tiene huella.
  registration?: unknown;
};

export type ScreenEventName = 'code' | 'read' | 'cancelled' | 'approved';

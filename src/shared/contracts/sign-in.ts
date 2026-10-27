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

export const signOutBody = z.object({
  pending: z.optional(z.object({ sessionId: z.uuid(), signature: base64url(200) })),
});

export type Person = { userId: string; name: string; email: string; role: string };

export type StartResponse = {
  environment: Environment;
  version: string;
  googleClientId: string;
  googleNonce?: string;
  person?: Person;
};

export type SignInResponse = { person: Person; sessionId: string; offerPasskey: boolean };

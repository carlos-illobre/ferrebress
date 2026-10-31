// La forma de lo que entra y sale de las rutas de Usuarios (diseño de 02, § 4), con largos máximos
// para cada campo. La usan el servidor para validar y la aplicación para armar los pedidos.
import * as z from 'zod/mini';

const version = z.int().check(z.minimum(1), z.maximum(2 ** 31 - 1));
const name = z.nullable(z.string().check(z.maxLength(80)));

export const authorizeBody = z.object({
  email: z.email().check(z.maxLength(254)),
  name: z.optional(name),
});

// Sin `name`, no cambia; `name` vacío o nulo, vuelve al de Google. Sin `email`, no cambia.
export const changeBody = z.object({
  version,
  name: z.optional(name),
  email: z.optional(z.email().check(z.maxLength(254))),
});

export const versionBody = z.object({ version });

export const cutBody = z.object({ from: z.enum(['card', 'lost']) });

// Una persona como la ve la lista (R3.1): las horas, en milisegundos desde 1970 (hora del servidor).
export type PersonRow = {
  id: string;
  // El que escribió quien la autorizó (para cambiarlo), y el que se muestra (R3.4).
  name: string | null;
  displayName: string;
  email: string;
  active: boolean;
  self: boolean;
  authorizedAt: number;
  // Quién la autorizó; nulo, la instalación.
  authorizedBy: string | null;
  deactivatedAt: number | null;
  lastSignInAt: number | null;
  neverSignedIn: boolean;
  version: number;
  sessions: number;
  phones: number;
};

export type PeopleResponse = { people: PersonRow[] };
export type PersonResponse = { person: PersonRow };

// Cómo entró una sesión (R5.2).
export type Way = 'google' | 'passkey' | 'qr' | 'offline';

export type SessionRow = {
  id: string;
  deviceLabel: string;
  way: Way;
  isPhone: boolean;
  createdAt: number;
  lastUsedAt: number;
};

// Un celular con huella (R5.5). `id` es opaco: ni el del dispositivo ni el de la huella.
export type PhoneRow = {
  id: string;
  deviceLabel: string;
  createdAt: number;
  lastUsedAt: number | null;
};

export type AccessResponse = { sessions: SessionRow[]; phones: PhoneRow[] };

// «Se perdió un celular» (R5.7): las personas con celulares para cortar.
export type LostPhone = {
  id: string;
  deviceLabel: string;
  sessions: number;
  passkey: boolean;
  lastUsedAt: number | null;
};
export type LostPhonesResponse = {
  people: { userId: string; displayName: string; self: boolean; phones: LostPhone[] }[];
};

// Qué cortó: cuántas sesiones cerró y si quitó la huella. En cero, no había nada que cortar.
export type CutResponse = { sessions: number; passkey: boolean };
export type ClosedResponse = { closed: number };

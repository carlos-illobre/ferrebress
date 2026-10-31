// Las reglas de las personas, sin tecnología: cómo se compara un correo, qué cuenta corresponde a un
// pase de Google (diseño de 01, § 5), qué nombre se muestra y quién nunca entró (diseño de 02, § 2).
export type User = {
  id: string;
  email: string;
  googleSubject: string | null;
  name: string | null;
  googleName: string | null;
  active: boolean;
  lastSignInAt: Date | null;
  authorizedBy: string | null;
  deactivatedAt: Date | null;
  version: number;
  createdAt: Date;
  // Quién le cambió los roles por última vez, y cuándo (R7.8).
  rolesChangedBy: string | null;
  rolesChangedAt: Date | null;
  // Los ids de sus roles (R3.1).
  roleIds: string[];
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

// El largo máximo de un nombre: el escrito y el de Google, que se corta.
export const maxNameLength = 80;

// Caracteres de control y de formato (entre ellos los que cambian la dirección del texto): un nombre
// solo es texto (02, § 9).
const unsafe = /[\p{Cc}\p{Cf}]/gu;

// Un nombre limpio: sin esos caracteres, sin espacios de más y dentro del largo; vacío es ninguno.
export function cleanName(name: string | null | undefined): string | null {
  const clean = (name ?? '').replace(unsafe, '').replace(/\s+/g, ' ').trim();
  return clean === '' ? null : clean.slice(0, maxNameLength);
}

// R3.4: el que escribió quien la autorizó; si no, el de Google; si no, el correo.
export const displayName = (user: Pick<User, 'name' | 'googleName' | 'email'>): string =>
  user.name ?? user.googleName ?? user.email;

// R3.6, R3.7: sin cuenta de Google atada ni entrada anotada.
export const neverSignedIn = (user: Pick<User, 'googleSubject' | 'lastSignInAt'>): boolean =>
  user.googleSubject === null && user.lastSignInAt === null;

export type GoogleMatch =
  | { kind: 'found'; user: User; link: boolean }
  | { kind: 'not-authorized'; reason: 'unknown' | 'inactive' | 'other-subject'; user?: User };

// Primero por el identificador de Google; si nadie lo tiene, por correo, pero solo una cuenta
// que todavía no tiene identificador: un correo que Google le dio a otra persona no entra.
export function matchGoogleAccount(
  candidates: User[],
  subject: string,
  email: string,
): GoogleMatch {
  const bySubject = candidates.find((user) => user.googleSubject === subject);
  const byEmail = candidates.find((user) => user.email === normalizeEmail(email));
  const user = bySubject ?? byEmail;
  if (!user) return { kind: 'not-authorized', reason: 'unknown' };
  if (!bySubject && user.googleSubject)
    return { kind: 'not-authorized', reason: 'other-subject', user };
  if (!user.active) return { kind: 'not-authorized', reason: 'inactive', user };
  return { kind: 'found', user, link: !bySubject };
}

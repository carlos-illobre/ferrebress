// Las reglas de las personas, sin tecnología: cómo se compara un correo y qué cuenta corresponde
// a un pase de Google (diseño de 01, § 5, «Google», paso 3).
export type User = {
  id: string;
  email: string;
  googleSubject: string | null;
  name: string | null;
  active: boolean;
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

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

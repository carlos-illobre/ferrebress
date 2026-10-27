// La cookie de la sesión (diseño de 01, § 4): `__Host-session`, que la página no puede leer, solo
// se manda a este sitio y vence con el tope de la sesión.
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { signInSettings } from '../settings.ts';

const name = 'session';
const options = { prefix: 'host', path: '/', secure: true } as const;

export const readSessionCookie = (c: Context): string | undefined => getCookie(c, name, 'host');

export const writeSessionCookie = (c: Context, token: string): void =>
  setCookie(c, name, token, {
    ...options,
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: signInSettings.session.maxMs / 1000,
  });

export const clearSessionCookie = (c: Context): void => {
  deleteCookie(c, name, options);
};

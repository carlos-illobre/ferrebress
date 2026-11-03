// Los tipos de acción de Entrar (capítulo 01) en Quién hizo qué.
import { type Entry, redIfOther, text, whom } from './kinds.ts';

const ways: Record<string, string> = {
  google: 'Entró con Google',
  passkey: 'Entró con la huella',
  qr: 'Entró con el código, desde el celular',
  offline: 'Entró sin conexión, con la huella',
};

// Por qué terminó una sesión (las sesiones de 01 · R3).
const endings: Record<string, string> = {
  idle: ': venció por no usarla',
  'max-age': ': llegó a su tope de horas',
  revoked: ': la cerraron desde Usuarios',
  deactivated: ': la dieron de baja',
  'sign-out': ': salió',
};

const refusals: Record<string, string> = {
  unknown: 'Intentó entrar con un correo no autorizado',
  inactive: 'Intentó entrar con una cuenta dada de baja',
  'other-subject': 'Intentó entrar con otra cuenta de Google con el mismo correo',
  'invalid-credential': 'Intentó entrar con un pase de Google que no sirve',
  nonce: 'Intentó entrar con un pase de Google vencido',
  'unknown-passkey': 'Intentó entrar con una huella que no se conoce',
  'invalid-signature': 'Intentó entrar con una huella que no verificó',
  'code-expired': 'Intentó entrar con un código vencido',
  'other-challenge': 'Intentó entrar con un código que no era el suyo',
  'invalid-permit': 'Intentó entrar con un permiso del celular que no sirve',
};

export const signInTypes = {
  'sign-in.succeeded': {
    group: 'sign-in',
    tone: 'plain',
    icon: 'log-in',
    name: 'Entró',
    shows: ['method', 'via'],
    says: (e) => [text(ways[String(e.data.method)] ?? 'Entró')],
  },
  'sign-out': {
    group: 'sign-in',
    tone: 'plain',
    icon: 'log-out',
    name: 'Salió',
    shows: ['pending', 'tappedAt'],
    says: (e) => [text(e.data.pending ? 'Salió sin conexión' : 'Salió')],
  },
  'session.ended': {
    group: 'sign-in',
    tone: 'plain',
    icon: 'timer-off',
    name: 'Terminó una sesión',
    shows: ['reason'],
    says: (e) => [
      text('Terminó la sesión de '),
      whom(e),
      text(endings[String(e.data.reason)] ?? ''),
    ],
  },
  'passkey.linked': {
    group: 'sign-in',
    tone: 'plain',
    icon: 'fingerprint',
    name: 'Vinculó la huella',
    shows: [],
    says: () => [text('Vinculó la huella de su celular')],
  },
  'code.read': {
    group: 'sign-in',
    tone: 'plain',
    icon: 'qr-code',
    name: 'Leyó el código de una computadora',
    shows: [],
    says: () => [text('Leyó el código de una computadora')],
  },
  'code.approved': {
    group: 'sign-in',
    tone: 'plain',
    icon: 'monitor-check',
    name: 'Dejó entrar a una computadora',
    shows: [],
    says: () => [text('Dejó entrar a una computadora con su celular')],
  },
  'code.cancelled': {
    group: 'sign-in',
    tone: 'plain',
    icon: 'monitor-x',
    name: 'Canceló la entrada de una computadora',
    shows: [],
    says: () => [text('Canceló la entrada de una computadora')],
  },
  'session.closed': {
    group: 'users',
    tone: redIfOther,
    icon: 'circle-x',
    name: 'Cerró una sesión',
    shows: ['sessions'],
    says: (e) => [text('Cerró una sesión de '), whom(e)],
  },
  'sessions.closed-all': {
    group: 'users',
    tone: redIfOther,
    icon: 'circle-slash',
    name: 'Cerró todas las sesiones',
    shows: ['sessions'],
    says: (e) => [text('Cerró todas las sesiones de '), whom(e)],
  },
  'passkey.removed': {
    group: 'users',
    tone: 'red',
    icon: 'unlink',
    name: 'Quitó un celular con huella',
    shows: ['sessions', 'passkey'],
    says: (e) => [text('Le quitó un celular con huella a '), whom(e)],
  },
  'phone.cut': {
    group: 'users',
    tone: 'red',
    icon: 'smartphone',
    name: 'Cortó un celular perdido',
    shows: ['sessions', 'passkey'],
    says: (e) => [text('Cortó un celular perdido de '), whom(e)],
  },
  'sign-in.rejected': {
    group: 'refused',
    tone: 'amber',
    icon: 'door-closed',
    name: 'Intentó entrar y no pudo',
    shows: ['method', 'reason'],
    says: (e) => [text(refusals[String(e.data.reason)] ?? 'Intentó entrar y no pudo')],
  },
  'passkey.rejected': {
    group: 'refused',
    tone: 'amber',
    icon: 'scan-face',
    name: 'No pudo vincular la huella',
    shows: ['reason'],
    says: () => [text('No pudo vincular la huella')],
  },
  'code.rejected': {
    group: 'refused',
    tone: 'amber',
    icon: 'scan-line',
    name: 'Usó un código desde otra red',
    shows: ['reason'],
    says: () => [text('Usó el código de una computadora desde otra red')],
  },
  'session.confirm-rejected': {
    group: 'refused',
    tone: 'amber',
    icon: 'shield-alert',
    name: 'No pudo confirmar quién era',
    shows: ['method'],
    says: () => [text('No pudo confirmar quién era')],
  },
} satisfies Record<string, Entry>;

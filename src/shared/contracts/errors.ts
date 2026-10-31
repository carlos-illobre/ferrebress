// Los errores que la API devuelve y la aplicación traduce a un texto (diseño de 01, § 4). Los de la
// plataforma sirven a cualquier módulo; los de cada módulo van aparte, así la base no depende de
// ningún negocio.
export type PlatformErrorCode =
  | 'bad-request'
  | 'not-authorized'
  | 'too-many-attempts'
  | 'update-required'
  | 'not-found'
  | 'unexpected';

// Entrar (capítulos 01 y 15).
export type SignInErrorCode =
  | 'sign-in-expired'
  // El celular sin huella tiene que entrar con Google antes de vincularla para una computadora.
  | 'sign-in-first'
  | 'code-expired'
  | 'code-used'
  | 'phone-has-other-account'
  | 'other-network'
  | 'session-closed'
  // Entrar sin conexión (15 · R3): el servidor no la confirmó, o ya la había confirmado.
  | 'offline-not-confirmed'
  | 'offline-already-confirmed';

// Usuarios (capítulo 02).
export type UsersErrorCode =
  | 'email-taken'
  | 'already-entered'
  | 'self'
  | 'last-administrator'
  // Otra persona la cambió antes: la respuesta trae cómo está ahora.
  | 'changed'
  // Hace falta pasar por Google o la huella de los últimos 5 minutos (R3.8).
  | 'confirm-first';

export type ErrorCode = PlatformErrorCode | SignInErrorCode | UsersErrorCode;

export type ErrorBody = { error: ErrorCode } & Record<string, unknown>;

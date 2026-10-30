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

export type ErrorCode = PlatformErrorCode | SignInErrorCode;

export type ErrorBody = { error: ErrorCode } & Record<string, unknown>;

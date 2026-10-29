// Los errores que la API devuelve y la aplicación traduce a un texto (diseño de 01, § 4).
export type ErrorCode =
  | 'bad-request'
  | 'not-authorized'
  | 'sign-in-expired'
  // El celular sin huella tiene que entrar con Google antes de vincularla para una computadora.
  | 'sign-in-first'
  | 'too-many-attempts'
  | 'code-expired'
  | 'code-used'
  | 'phone-has-other-account'
  | 'other-network'
  | 'session-closed'
  // Entrar sin conexión (15 · R3): el servidor no la confirmó, o ya la había confirmado.
  | 'offline-not-confirmed'
  | 'offline-already-confirmed'
  | 'update-required'
  | 'not-found'
  | 'unexpected';

export type ErrorBody = { error: ErrorCode } & Record<string, unknown>;

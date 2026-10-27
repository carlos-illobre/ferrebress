// Los errores que la API devuelve y la aplicación traduce a un texto (diseño de 01, § 4).
export type ErrorCode =
  | 'bad-request'
  | 'not-authorized'
  | 'too-many-attempts'
  | 'code-expired'
  | 'code-used'
  | 'phone-has-other-account'
  | 'session-closed'
  | 'update-required'
  | 'not-found'
  | 'unexpected';

export type ErrorBody = { error: ErrorCode } & Record<string, unknown>;

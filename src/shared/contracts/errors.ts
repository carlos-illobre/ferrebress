// Los errores que la API devuelve y la aplicación traduce a un texto (diseño de 01, § 4). Los de la
// plataforma sirven a cualquier módulo; los de cada módulo van aparte, así la base no depende de
// ningún negocio.
export type PlatformErrorCode =
  | 'bad-request'
  | 'not-authorized'
  | 'too-many-attempts'
  | 'update-required'
  | 'not-found'
  // Falta un permiso; la respuesta dice cuál (02 · R7.6).
  | 'forbidden'
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
  | 'offline-already-confirmed'
  // El dispositivo no probó con su llave ser el que dice (diseño de 01, § 6).
  | 'device-unproven';

// Usuarios (capítulo 02).
export type UsersErrorCode =
  | 'email-taken'
  | 'already-entered'
  | 'self'
  | 'last-administrator'
  // Otra persona la cambió antes: la respuesta trae cómo está ahora.
  | 'changed'
  // Hace falta pasar por Google o la huella de los últimos 5 minutos (R3.8).
  | 'confirm-first'
  // Roles (R7): el nombre ya está, alguien lo tiene, es el Administrador, una persona sin roles, y
  // la persona tiene permisos que quien lo pide no tiene (R7.11).
  | 'role-name-taken'
  | 'role-in-use'
  | 'system-role'
  | 'no-roles'
  | 'outranked'
  | 'too-many-roles'
  | 'person-inactive'
  | 'person-missing';

// Celular y computadora (capítulo 03): otra persona en el celular (E37), un código que se lee desde
// una computadora, un pedido de quien no es del vínculo (E38), el otro lado que no está o se fue, y
// una escritura con un vínculo que ya terminó.
export type DeviceLinkErrorCode =
  | 'other-account'
  | 'not-a-phone'
  | 'not-paired'
  | 'peer-absent'
  | 'peer-gone'
  | 'pairing-ended';

// Administración (capítulo 06): un valor fuera de su rango o sus opciones, otro lo cambió antes, el
// redondeo cambia precios y hay que confirmar cuántos, y el recálculo falló.
export type AdministrationErrorCode =
  | 'invalid-setting'
  | 'setting-changed'
  | 'confirm-prices'
  | 'recalc-failed';

export type ErrorCode =
  | PlatformErrorCode
  | SignInErrorCode
  | UsersErrorCode
  | DeviceLinkErrorCode
  | AdministrationErrorCode;

export type ErrorBody = { error: ErrorCode } & Record<string, unknown>;

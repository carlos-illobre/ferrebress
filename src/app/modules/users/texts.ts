// Los textos de Usuarios (maquetas aprobadas de 02, users-a/final). Largos en la computadora, que
// explican; cortos en el celular (00 · R3). Los del servidor no llegan a la pantalla: cada error
// tiene su texto acá.
import type { Words } from '../../ui/say/Say.tsx';

const words = (long: string, short: string): Words => ({ long, short });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const texts = {
  title: 'Usuarios',
  tabs: 'Las pestañas de Usuarios',
  audit: 'Auditoría',
  soon: 'Pronto',
  authorize: 'Autorizar a alguien',
  lost: 'Se perdió un celular',
  lostDetail: 'Cortá su sesión y su huella',
  stats: {
    active: 'Pueden entrar',
    sessions: 'Sesiones',
    phones: 'Con huella',
    never: 'Sin entrar aún',
  },
  searchLabel: 'Buscar a una persona',
  search: words('Buscá por nombre o correo', 'Buscar'),
  filters: { all: 'Todas', active: 'Activas', never: 'Sin entrar', off: 'De baja' },
  filtersLabel: 'Qué personas ver',
  canEnter: 'Pueden entrar',
  deactivatedGroup: 'Dadas de baja',
  nobody: (search: string) => `Nadie con «${search}»`,
  nobodyHint: 'Buscá por nombre o por correo.',
  nobodyHere: 'Nadie en este filtro.',
  you: 'Vos',
  role: 'Administrador',
  deactivated: 'Dada de baja',
  noName: words('Sin nombre: se ve su correo hasta que entre', 'Sin nombre todavía'),
  signedIn: (since: string) => `Entró ${since}`,
  neverSignedIn: 'Todavía no entró',
  sessionsCount: 'Sesiones abiertas',
  phonesCount: 'Celulares con huella',
  loading: 'Buscando a las personas',
  loadFailed: 'No se pudo traer la lista.',
  retry: 'Reintentar',
  offline: 'Sin conexión · se ve lo último, vuelve sola',
};

export const cardTexts = {
  choose: 'Elegí a alguien',
  chooseHint: 'Su tarjeta aparece acá.',
  back: 'Volver a la lista',
  editName: 'Cambiar el nombre',
  editEmail: 'Cambiar el correo',
  bound:
    'Ya entró: su cuenta de Google quedó atada a ella. Para otra cuenta, autorizá el correo nuevo y dale de baja a este.',
  namePlaceholder: (never: boolean) =>
    never ? 'Vacío: se ve su correo' : 'Vacío: vuelve al de Google',
  editHelp: 'Enter guarda · Esc cancela',
  authorizedAt: (date: string) => `Autorizada el ${date}`,
  // El primer Administrador, que cargó el comando al instalar (R1.2).
  installed: (date: string) => `Desde la instalación, el ${date}`,
  deactivatedAt: (date: string) => `Dada de baja el ${date}`,
  neverHint: (email: string) =>
    `Todavía no entró. Avisale que entre con Google con ${email}: Ferrebress no le manda ningún correo.`,
  offHint:
    'No puede entrar: ve el mismo mensaje que una cuenta no autorizada. Si le das de alta, entra con su misma cuenta de Google; sus celulares con huella los vincula de nuevo.',
  closeAll: 'Cerrar todas',
  close: 'Cerrar',
  remove: 'Quitar',
  noSessions: 'Sin sesiones abiertas en otros dispositivos.',
  ownSession: words(
    'La sesión de esta computadora no figura: se cierra con «Salir».',
    'La sesión de este celular no figura: se cierra con «Salir».',
  ),
  ownPhones: 'Los tuyos van en Configuración.',
  noPhones: 'No vinculó ningún celular con huella.',
  sessionLine: (way: string, since: string) => `${way} · Entró ${since}`,
  usedSession: (since: string) => `Usada ${since}`,
  linked: (date: string) => `Vinculado el ${date}`,
  usedPhone: (since: string | undefined) => (since ? `Usado ${since}` : 'Todavía no se usó'),
  selfNote: 'No te podés dar de baja vos: lo tiene que hacer otro Administrador.',
  activate: 'Dar de alta',
  deactivate: 'Dar de baja',
  delete: 'Borrar el alta',
  deleteHint: 'Nunca entró: se borra del todo.',
  loading: 'Buscando sus sesiones',
};

export const doneTexts = {
  nameSaved: 'Nombre guardado',
  nameCleared: (never: boolean) => `Nombre borrado: se ve ${never ? 'su correo' : 'el de Google'}`,
  emailSaved: 'Correo cambiado: entra con la cuenta nueva',
  authorized: 'Autorizada. Avisale que entre con Google',
  deleted: (email: string) => `Se borró el alta de ${email}`,
  deactivated: (name: string) => `${name} quedó dada de baja`,
  activated: (name: string) => `${name} puede entrar otra vez`,
  sessionClosed: (device: string) => `Sesión cerrada · ${device}`,
  nothingToClose: 'Ya estaba cerrada: no había nada que cortar',
  closedAll: (n: number) =>
    n === 0
      ? 'No había sesiones abiertas'
      : n === 1
        ? 'Se cerró la sesión'
        : `Se cerraron las ${n} sesiones`,
  phoneRemoved: (closed: boolean) =>
    `Celular quitado: ya no entra con la huella${closed ? ' y se cerró su sesión' : ''}`,
  nothingToCut: 'Ese celular ya no tiene ni sesión ni huella: no había nada que cortar',
  cut: (device: string, name: string, sessions: number, passkey: boolean) => {
    const what = [
      sessions > 0 &&
        (sessions === 1 ? 'se cerró su sesión' : `se cerraron sus ${sessions} sesiones`),
      passkey && 'se le quitó la huella',
    ].filter(Boolean);
    const said = what.join(' y ');
    return `Cortado: ${device} de ${name}. ${said.charAt(0).toUpperCase()}${said.slice(1)}`;
  },
};

// Lo que dice cada rechazo del servidor (diseño de 02, § 4).
export const refusalTexts: Record<string, string> = {
  'email-taken': 'Ese correo ya está cargado (sin importar mayúsculas).',
  'bad-request': 'Eso no tiene forma de correo. Revisalo: falta algo como «@gmail.com».',
  'already-entered': 'Ya entró: no se puede cambiar el correo ni borrar. Dale de baja.',
  self: 'No te podés dar de baja vos: lo tiene que hacer otro Administrador.',
  'last-administrator': 'Es el último Administrador activo: no puede quedar nadie para entrar.',
  changed: 'Alguien la cambió recién: ahora se ve como quedó. Revisala y probá de nuevo.',
  'not-found': 'Ya no está: alguien la borró recién.',
  'too-many-requests': 'Demasiados cambios seguidos. Esperá un minuto.',
  offline: 'Sin conexión: no se guardó.',
};
export const somethingFailed = 'No se pudo. Probá de nuevo.';

export const dialogTexts = {
  deactivateTitle: (name: string) => `¿Dar de baja a ${name}?`,
  deactivateLead: 'Lo saca de todo. Sigue en la lista y lo podés dar de alta cuando quieras.',
  deactivateSessions: (n: number) =>
    n > 0
      ? `Se cierran sus ${plural(n, 'sesión', 'sesiones')}: cada dispositivo vuelve a la entrada con «Tu sesión se cerró desde otro dispositivo».`
      : 'No tiene sesiones abiertas.',
  deactivatePhones: (n: number) =>
    n > 0
      ? `Se ${n > 1 ? 'quitan sus' : 'quita su'} ${plural(n, 'celular con huella', 'celulares con huella')} y se le apaga «Trabajar sin conexión».`
      : 'No tiene celulares con huella.',
  deactivateEntry: 'Ya no entra: ve lo mismo que una cuenta no autorizada.',
  closeAllTitle: (n: number, name: string) =>
    n === 1 ? `¿Cerrar la sesión de ${name}?` : `¿Cerrar las ${n} sesiones de ${name}?`,
  closeAllLead: (self: boolean) =>
    self
      ? 'Todas menos la de este dispositivo. Es lo que se hace si te roban el celular.'
      : 'Es lo que se hace si le roban el celular y no sabés cuál es la sesión.',
  cancel: 'Cancelar',
  authorizeTitle: 'Autorizar a alguien',
  authorizeYes: 'Autorizar',
  authorizeLead: 'Su nombre y su correo de Google. No se le manda ningún correo: avisale vos.',
  name: 'Nombre',
  nameHint: 'Puede quedar vacío: se ve el de Google cuando entre.',
  email: 'Correo de Google',
  emailPlaceholder: 'correo@gmail.com',
  lostWho: '¿De quién es el celular?',
  lostWhoLead: 'Aparecen solo quienes tienen un celular con una sesión abierta o con huella.',
  lostNobody: 'Nadie tiene un celular con una sesión abierta ni con huella.',
  lostOne: (name: string) => `El celular de ${name}`,
  lostWhich: (name: string) => `¿Cuál celular de ${name}?`,
  lostLead:
    '«Cortar» cierra su sesión y le quita la huella, sin preguntar. Si aparece, lo vincula de nuevo.',
  lostYou: (name: string) => `${name} (vos)`,
  phonesOf: (n: number) => plural(n, 'celular', 'celulares'),
  openSessions: (n: number) => (n === 1 ? 'sesión abierta' : `${n} sesiones abiertas`),
  withPasskey: 'con huella',
  cut: 'Cortar',
};

// Los textos de Administración (capítulo 06): largos en la computadora, que explican, y cortos en el
// celular, que dicen lo mismo (00 · R1.5).
import type { SettingKey } from '@ferrebress/shared/contracts/administration';

type Words = { long: string; short: string };

export type Panel =
  | 'roundingStep'
  | 'quickMargins'
  | 'lists'
  | 'zone'
  | 'session'
  | 'pairingDays'
  | 'entry';

export const panels: Panel[] = [
  'roundingStep',
  'quickMargins',
  'lists',
  'zone',
  'session',
  'pairingDays',
  'entry',
];

export const groupOf: Record<Panel, string> = {
  roundingStep: 'Precios',
  quickMargins: 'Precios',
  lists: 'Listas de precios',
  zone: 'Negocio',
  session: 'Acceso',
  pairingDays: 'Acceso',
  entry: 'Acceso',
};

export const names: Record<SettingKey | 'zone', string> = {
  roundingStep: 'Redondeo',
  quickMargins: 'Márgenes rápidos',
  zone: 'Zona horaria',
  sessionIdle: 'Sin uso',
  sessionMax: 'Tope de la sesión',
  pairingDays: 'Días del vínculo',
  offlineHours: 'Horas sin conexión',
  googleAttempts: 'Intentos con Google',
  passkeyAttempts: 'Intentos con la huella',
  failedAttempts: 'Intentos fallidos',
  reviewPercent: 'Para revisar',
  goneWarnPercent: 'Aviso de bajas',
  maxFileMb: 'Tamaño de una lista',
  confirmRows: 'Aviso de filas',
  filesMb: 'Espacio de los archivos',
  unappliedFileDays: 'Listas sin aplicar',
};

export { what } from './what.ts';

// Las pantallas que se abren desde Administración (06 · pantalla 1).
export const pagesTexts = {
  title: 'También en Administración',
  anomalies: { name: 'Anomalías', detail: 'Lo que alguien tiene que mirar' },
  readers: { name: 'Lectores', detail: 'Los que entienden la planilla de cada proveedor' },
  files: { name: 'Archivos de listas', detail: 'Los originales de las listas subidas' },
};

export const texts = {
  title: 'Administración',
  back: 'Más',
  forAll: { long: 'Lo que se fija acá vale para todos', short: 'Vale para todos' },
  loading: 'Cargando los ajustes…',
  loadFailed: 'No se pudieron traer los ajustes.',
  retry: 'Reintentar',
  offline: (at: string) => ({
    long: `Sin conexión: es lo último que se vio, a las ${at}. Con conexión se puede cambiar.`,
    short: `Sin conexión · ${at}`,
  }),
  neverSeen: 'Hace falta conexión',
  neverSeenDetail: 'Los ajustes están en el servidor y este dispositivo todavía no los vio.',
  hint: 'Pasá por una opción para ver su efecto',
  // Sin el permiso (R1.2, E02): qué falta y quién lo tiene.
  noPermission: (roles: string) =>
    `Para cambiar algo hace falta «Cambiar los ajustes»${roles ? `: lo tiene ${roles}` : ''}.`,
  lostPermission: 'Ya no tenés «Cambiar los ajustes»: no se guardó.',
  saved: (name: string, value: string) => `${name}: ${value}`,
  undo: 'Deshacer',
  changedBy: (who: string, value: string) =>
    `Lo cambió ${who || 'otra persona'} recién: ahora vale ${value}.`,
  repeated: (margin: number) => `Ya hay un margen rápido de ${margin} %.`,
  invalid: {
    quickMargins: 'Va un entero entre 1 y 10.000.',
    pairingDays: 'Entre 1 y 365 días.',
    range: (min: string, max: string) => `Va un entero entre ${min} y ${max}.`,
  },
  failed: 'No se pudo guardar. Probá de nuevo.',
  rounding: {
    title: 'Redondeo para arriba',
    subtitle: 'Un precio escrito a mano no se toca.',
    now: (step: string) => `Con ${step}`,
    ifChosen: (step: string) => `Si elegís ${step}`,
    prices: (n: string) => `${n} precios`,
    change: (n: string) => `Cambian ${n}`,
    noChange: 'No cambia ninguno',
    none: 'Sin',
    choose: 'Elegí el paso · debajo, cuántos precios cambian',
    initial: 'de arranque',
    current: 'Ahora',
    showToday: 'Así quedan hoy',
    showWith: (step: string) => `Así quedan con ${step}`,
    calculated: (price: string) => `Calculado ${price}`,
    noPrices: 'Todavía no hay precios: este es un ejemplo.',
    example: 'Un precio calculado',
    confirmTitle: (step: string) =>
      step === 'Sin redondeo'
        ? '¿Dejar los precios sin redondeo?'
        : `¿Redondear para arriba a ${step}?`,
    confirmDetail:
      'Se recalculan ahora todos los precios de venta guardados. El precio escrito a mano no se toca.',
    changing: (n: string, total: string) => `${n} de ${total} precios cambian`,
    confirm: (n: string) => `Cambiar ${n} precios`,
    cancel: 'Cancelar',
    recalcFailed: 'No se pudo recalcular: no cambió ningún precio.',
    later: 'Ahora no',
  },
  margins: {
    title: 'Márgenes rápidos',
    subtitle: 'Se ordenan solos; cambiarlos no toca ningún producto.',
    touch: 'Tocá un número para cambiarlo',
    key: (n: number) => `Margen de la tecla ${n}`,
    sells: 'Vende a',
    unit: '%',
    // Un costo de ejemplo, para ver a cuánto vende cada tecla con el redondeo de ahora.
    example: (cost: string, step: string) => `Con un costo de ${cost} y el redondeo de ${step}`,
  },
  zone: {
    title: 'Zona horaria del negocio',
    subtitle: 'Se fijó al instalar y es la misma para todos.',
    nowIn: 'Ahora en el negocio',
    says: 'Las ventas de hoy van de 0:00 a 23:59 de esta hora, vea quien vea la pantalla.',
    locked: 'Se cambia solo al instalar',
  },
  session: {
    title: 'Tiempos de la sesión',
    subtitle: 'Valen desde ese momento para todas las sesiones, también las abiertas.',
    shorter: 'Más corto',
    longer: 'Más largo',
    at: (time: string) => `a las ${time}`,
    day: 'Un día en el mostrador',
    closesAtLunch: (time: string) =>
      `Se fue a almorzar a las 12:10: la sesión se cierra a las ${time} y a las 13:30 entra de nuevo.`,
    staysAtLunch: 'Se fue a almorzar a las 12:10 y volvió a las 13:30: sigue adentro.',
    endsWhileOpen: (time: string) =>
      `Entró a las 8:00: a las ${time} entra de nuevo, aunque la esté usando.`,
    endsAfterClosing: (time: string) =>
      `Entró a las 8:00: el tope llega a las ${time}, después de cerrar.`,
  },
  lists: {
    title: 'Listas de precios',
    subtitle:
      'Valen desde la lista siguiente que se sube; una que ya está en espera se vuelve a mirar con los valores nuevos.',
    review: 'Al ver qué cambia',
    upload: 'Al subir una lista',
    files: 'Los archivos',
    type: 'Escribí el número; se guarda al salir de la caja',
    initial: (value: string) => `De arranque, ${value}`,
  },
  entry: {
    title: 'La entrada',
    subtitle:
      'Valen desde el próximo intento, sin cortar ninguna sesión; un celular sin conexión sigue con las horas que tenía hasta su próximo pedido.',
    attempts: 'Los intentos',
  },
  pairing: {
    title: 'Días del vínculo',
    subtitle: 'Vale para todos los vínculos, también los que ya existen.',
    expires: 'Si hoy se espejan por última vez, vence el',
    howMany: 'Cuántos días',
    days: 'días',
    weeks: 'Cada cuadrito, una semana',
  },
  units: {
    minutes: (n: number) => `${n} min`,
    hours: (n: number) => `${n} h`,
    perMinute: (n: number) => `${n} por minuto`,
    perHour: (n: number) => `${n} por hora`,
    days: (n: number) => `${n} días`,
    percent: (n: number) => `${n} %`,
    mb: (n: string) => `${n} MB`,
    rows: (n: string) => `${n} filas`,
  },
};

export type { Words };

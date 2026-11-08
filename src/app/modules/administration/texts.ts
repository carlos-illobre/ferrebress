// Los textos de Administración (capítulo 06): largos en la computadora, que explican, y cortos en el
// celular, que dicen lo mismo (00 · R1.5).
import type { SettingKey } from '@ferrebress/shared/contracts/administration';

type Words = { long: string; short: string };

export type Panel = 'roundingStep' | 'quickMargins' | 'zone' | 'session' | 'pairingDays';

export const panels: Panel[] = ['roundingStep', 'quickMargins', 'zone', 'session', 'pairingDays'];

export const groupOf: Record<Panel, string> = {
  roundingStep: 'Precios',
  quickMargins: 'Precios',
  zone: 'Negocio',
  session: 'Acceso',
  pairingDays: 'Acceso',
};

export const names: Record<SettingKey | 'zone', string> = {
  roundingStep: 'Redondeo',
  quickMargins: 'Márgenes rápidos',
  zone: 'Zona horaria',
  sessionIdle: 'Sin uso',
  sessionMax: 'Tope de la sesión',
  pairingDays: 'Días del vínculo',
};

// Qué cambia cada ajuste, en una línea (R1.3).
export const what: Record<SettingKey | 'zone', Words> = {
  roundingStep: {
    long: 'El precio que calcula el sistema sube al múltiplo siguiente',
    short: 'Al múltiplo siguiente',
  },
  quickMargins: {
    long: 'Los cinco atajos para el margen de un producto, teclas 1 a 5',
    short: 'Teclas 1 a 5',
  },
  zone: {
    long: 'Se fijó al instalar: el día de las ventas y el cierre de caja',
    short: 'Se fija al instalar',
  },
  sessionIdle: {
    long: 'Sin usarla, la sesión se cierra pasado esto',
    short: 'Sin usarla, se cierra',
  },
  sessionMax: {
    long: 'Lo más que dura una sesión desde que se entró',
    short: 'Desde que se entró',
  },
  pairingDays: { long: 'Lo que dura el vínculo sin estar en espejo', short: 'Sin estar en espejo' },
};

export const texts = {
  title: 'Administración',
  back: 'Más',
  forAll: { long: 'Lo que se fija acá vale para todos', short: 'Vale para todos' },
  loading: 'Cargando los ajustes…',
  loadFailed: 'No se pudieron traer los ajustes.',
  retry: 'Reintentar',
  offline: {
    long: 'Sin conexión: es lo último que se vio. Con conexión se puede cambiar.',
    short: 'Sin conexión',
  },
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
  invalid: {
    quickMargins: 'Va un entero entre 1 y 10.000, sin repetir.',
    pairingDays: 'Entre 1 y 365 días.',
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
    days: (n: number) => `${n} días`,
  },
};

export type { Words };

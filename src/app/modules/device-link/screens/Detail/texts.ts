// Los textos del detalle del vínculo (maqueta aprobada de 03): largos en la computadora, cortos en el
// celular. Se bajan con el detalle, no en el arranque.
import type { Words } from '../../../../ui/say/Say.tsx';

const words = (long: string, short: string): Words => ({ long, short });

export const detailTexts = {
  detail: {
    title: {
      computer: words('El vínculo con tu celular', 'Con la computadora'),
      unpairedComputer: words('Trabajar con el celular', 'Trabajar con la compu'),
    },
    close: 'Cerrar',
    here: { computer: 'Esta compu', phone: 'Este celular' },
    noOther: { computer: 'Sin celular', phone: 'Sin compu' },
    over: { direct: ' · por el Wi-Fi', relayed: ' · por internet' },
    phrase: {
      unpaired: words(
        'Esta computadora no está vinculada a ningún celular. Vinculalo para usarlo como control remoto: lo que toques en uno se ve en el otro.',
        'En la computadora, tocá el indicador y leé el código.',
      ),
      direct: words(
        'Tu celular y esta computadora muestran lo mismo y se hablan directo por el Wi-Fi del local: no gastan internet y lo que tocás llega al instante.',
        'Muestran lo mismo, directo por el Wi-Fi del local.',
      ),
      relayed: words(
        'Muestran lo mismo por el servidor, porque la red no deja la conexión directa. Gasta datos de internet, tarda un poco más y no se reintenta sola.',
        'Muestran lo mismo por internet: la red no deja la directa.',
      ),
      paused: words(
        'Siguen vinculados, pero cada uno trabaja por su lado. Sigue así hasta que alguien toque «Reconectar», aunque salgan y vuelvan a entrar.',
        'Vinculados, cada uno por su lado hasta «Reconectar».',
      ),
      waiting: words(
        'El celular no tiene Ferrebress abierto (pantalla apagada u otra aplicación encima). Cuando vuelva, se encuentran solos y va a esta pantalla.',
        'La computadora no tiene Ferrebress abierto. Cuando vuelva, se encuentran solos.',
      ),
      offline: words(
        'Se cortó la conexión directa y no hay internet para volver a encontrarse. Cuando vuelva internet, se encuentran solos.',
        'Se cortó la directa y no hay internet. Se encuentran solos al volver.',
      ),
    },
    probeFailed: words(
      'No se pudo: la red sigue sin dejar la conexión directa.',
      'No se pudo: la red no deja la conexión directa.',
    ),
    steps: [
      'Tocá «Vincular el celular»: aparece un código.',
      'Leelo con el celular, con tu misma cuenta adentro.',
      'Desde ahí, lo que toques en uno se ve en el otro. No pide permisos.',
    ],
    pairedWith: 'Vinculado con',
    since: (when: string) => `desde ${when}`,
    lasts: 'Dura sin usarse',
    until: (when: string) => `Hasta el ${when}`,
    daysLeft: (left: number, of: number) => `${left} de ${of} días`,
  },
  today: {
    together: 'Hoy juntos',
    direct: (share: number) => `${share} % directo`,
    now: 'Ahora',
    lanes: { direct: 'Directo', relayed: 'Por el servidor', apart: 'Separados' },
    summary: (from: string, to: string, direct: string, relayed: string, apart: string) =>
      `De ${from} a ${to}: directo ${direct}, por el servidor ${relayed}, separados ${apart}.`,
  },
  unpair: {
    title: { computer: '¿Desvincular el celular?', phone: '¿Desvincular la computadora?' },
    detail: {
      computer:
        'deja de estar vinculado. Cada uno sigue en la pantalla en la que está; para volver a trabajar juntos hay que vincular de nuevo.',
      phone:
        'deja de estar vinculada. Cada uno sigue en su pantalla; para volver a trabajar juntos, vinculá de nuevo.',
    },
    cancel: 'Cancelar',
    yes: 'Desvincular',
  },
  actions: {
    probe: 'Probar conexión directa',
    probing: words('Probando la conexión directa…', 'Probando…'),
    pause: 'Desconectar',
    resume: 'Reconectar',
    pairComputer: 'Vincular el celular',
    pairPhone: 'Leer el código',
    unpair: 'Desvincular',
  },
};

// Cuánto: «2 h 17 min», «11 min».
export function duration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

// La hora del día: «8:00».
export const clock = (at: number) => {
  const when = new Date(at);
  return `${when.getHours()}:${String(when.getMinutes()).padStart(2, '0')}`;
};

// El día: «jueves 3 de diciembre».
export const day = (at: number) =>
  new Date(at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

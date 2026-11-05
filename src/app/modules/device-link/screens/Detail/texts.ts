// Los textos del detalle del vínculo (maqueta aprobada de 03): largos en la computadora, cortos en el
// celular. Los que hablan desde un lado («el celular no tiene Ferrebress abierto») se eligen por el
// lado, no por el ancho: un celular acostado o una computadora angosta dicen lo de su lado. Se bajan
// con el detalle, no en el arranque.
import { addDays, businessDateOf, businessTimeZone } from '@ferrebress/shared/time/business';
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
    // Desde cada lado.
    sided: {
      unpaired: {
        computer:
          'Esta computadora no está vinculada a ningún celular. Vinculalo para usarlo como control remoto: lo que toques en uno se ve en el otro.',
        phone: 'En la computadora, tocá el indicador y leé el código.',
      },
      waiting: {
        computer:
          'El celular no tiene Ferrebress abierto (pantalla apagada u otra aplicación encima). Cuando vuelva, se encuentran solos y va a esta pantalla.',
        phone: 'La computadora no tiene Ferrebress abierto. Cuando vuelva, se encuentran solos.',
      },
    },
    phrase: {
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
  code: {
    title: 'Vincular el celular',
    back: 'Volver',
    once: 'Sirve una vez',
    renews: (seconds: number) => `Se renueva en 0:${String(seconds).padStart(2, '0')}`,
    renewsFull: 'Se renueva en 1:00',
    steps: [
      'En el celular, abrí Ferrebress con tu misma cuenta.',
      'Tocá el indicador de arriba y «Leer el código», o apuntale con la cámara del teléfono.',
      'Listo: el celular viene a esta pantalla.',
    ],
    replaces: (other: string) =>
      `Ya está vinculada con ${other}. Si lo lee otro celular, lo reemplaza: el celular pregunta antes.`,
    waiting: 'Esperando que el celular lo lea…',
    qr: 'Código para vincular',
  },
  camera: {
    title: 'Leer el código',
    tip: 'Apuntá al código de la computadora',
    unavailable: 'No se pudo abrir la cámara. Podés leer el código con la cámara del teléfono.',
    close: 'Cerrar',
  },
  reading: {
    otherAccount: {
      title: 'Este código es de otra cuenta',
      detail: 'Entrá con la misma cuenta en los dos.',
    },
    expired: {
      title: 'Este código venció',
      detail:
        'Cada código sirve una vez y se renueva cada minuto. Leé el que muestra ahora la computadora.',
    },
    offline: {
      title: 'Para vincular hace falta internet',
      detail: 'Probá cuando vuelva la conexión.',
    },
    failed: {
      title: 'No se pudo vincular',
      detail: 'Probá de nuevo en un momento.',
    },
    ok: 'Entendido',
    cancel: 'Cancelar',
    again: 'Leer el nuevo',
  },
  replace: {
    phone: (was: string) => `Este celular está vinculado a ${was}. ¿Reemplazar?`,
    computer: 'Esta computadora está vinculada a otro celular. ¿Reemplazar?',
    detail: 'El vínculo anterior se termina. Esta pasa a ser la tuya.',
    cancel: 'Cancelar',
    yes: 'Reemplazar',
  },
  toast: {
    pairedPhone: 'Vinculados: fuiste a la pantalla de la compu',
    pairedComputer: 'Vinculados: el celular vino a esta pantalla',
    paused: words(
      'Desconectados: cada uno sigue por su lado',
      'Desconectados: cada uno por su lado',
    ),
    resumed: {
      computer: 'Reconectados: el celular vino a esta pantalla',
      phone: 'Reconectados: fuiste a la pantalla de la compu',
    },
    unpaired: 'Desvinculados: cada uno sigue en su pantalla',
    direct: words('Ahora van directo por el Wi-Fi del local', 'Ahora van directo por el Wi-Fi'),
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
// Las fechas, en la zona del negocio y como en la maqueta: «jueves 3 de diciembre».
const parts = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: businessTimeZone,
});
const partsOf = (at: number) =>
  Object.fromEntries(parts.formatToParts(new Date(at)).map((part) => [part.type, part.value]));

export const day = (at: number) => {
  const { weekday, day: date, month } = partsOf(at);
  return `${weekday} ${date} de ${month}`;
};

// Desde cuándo, como en la maqueta: «ayer, lunes 2 de noviembre, 8:14» («hoy» o «ayer» si lo es).
export function since(at: number, now: number): string {
  const [then, today] = [businessDateOf(new Date(at)), businessDateOf(new Date(now))];
  const near = then === today ? 'hoy, ' : then === addDays(today, -1) ? 'ayer, ' : '';
  const { hour, minute } = partsOf(at);
  return `${near}${day(at)}, ${Number(hour)}:${minute}`;
}

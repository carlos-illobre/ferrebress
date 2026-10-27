// Los textos del marco, con su forma larga (computadora) y corta (celular), 00 · R3.
import type { Words } from '../../ui/say/Say.tsx';

const same = (text: string): Words => ({ long: text, short: text });

export const texts = {
  menu: 'Menú',
  more: 'Más',
  comingSoon: 'Pronto',
  collapse: 'Minimizar el menú',
  expand: 'Agrandar el menú',
  notYet: (name: string) =>
    `${name} todavía no está. Cuando se sume, se abre desde acá y deja de decir «Pronto».`,
  notYetShort: (name: string) => `${name} · pronto. Todavía no está.`,
  workArea: 'Área de trabajo',
  session: 'Tu sesión',
  signOut: same('Salir'),
  signOutDetail: 'Cerrar la sesión en este celular',
  signingOut: 'Saliendo',
  close: 'Cerrar',
  light: {
    online: { long: 'En línea · todo enviado', short: 'En línea' },
    offline: { long: 'Sin conexión · nada por enviar', short: 'Sin conexión' },
  },
  pending: {
    title: 'Lo que está por enviar',
    onlineHead: 'Todo enviado',
    onlineDetail: {
      long: 'No queda nada guardado en este dispositivo: el servidor tiene todo.',
      short: 'No queda nada por mandar.',
    },
    offlineHead: 'Sin conexión',
    offlineDetail: {
      long: 'No queda nada por enviar. Cuando vuelva la conexión, todo sigue andando solo.',
      short: 'Nada por enviar. Sigue sola al volver.',
    },
    note: 'La luz dice lo que contestó el servidor la última vez; no consulta nada por su cuenta.',
  },
  testEnvironment: 'Ambiente de prueba',
  testEnvironmentDetail: ' · nada de esto es real',
  wait: {
    unknown: { long: 'Puede tardar un poco', short: 'Un momento' },
    done: 'Listo',
  },
  update: {
    title: 'Hay una versión nueva',
    detail: {
      long: 'Actualizá cuando termines: tarda unos segundos y volvés a la misma parte, sin perder nada.',
      short: 'Tarda unos segundos y no perdés nada.',
    },
    notNow: 'Ahora no',
    now: 'Actualizar',
    updating: 'Actualizando…',
    later: {
      long: 'No vuelve a aparecer: se actualiza sola la próxima vez que abras la aplicación.',
      short: 'Se actualiza sola la próxima vez.',
    },
    done: { long: 'Versión nueva. Seguís donde estabas.', short: 'Versión nueva.' },
    requiredTitle: 'Hay que actualizar para seguir',
    requiredDetail: {
      long: 'Esta versión ya no se entiende con el servidor. Actualizar tarda unos segundos y lo que hiciste sigue ahí.',
      short: 'Esta versión ya no sirve. Lo que hiciste sigue ahí.',
    },
  },
  crash: {
    title: 'Algo salió mal',
    detail: {
      long: 'No fue por algo que hiciste. Lo que estabas haciendo sigue ahí, tal cual.',
      short: 'Lo que estabas haciendo sigue ahí.',
    },
    whatToDo: 'Qué hacer',
    steps: [
      {
        long: 'Tocá «Seguir sin avisar» y probá de nuevo lo que estabas haciendo.',
        short: 'Tocá «Seguir sin avisar» y probá de nuevo.',
      },
      { long: 'Si vuelve a pasar, avisalo: así se arregla.', short: 'Si vuelve a pasar, avisalo.' },
    ],
    contents: 'Lo que va en el aviso',
    captureLabel: 'La pantalla cuando pasó',
    privacy: {
      long: 'Sin datos de clientes ni tu sesión. Queda guardado en este dispositivo y se manda solo cuando esté Mejoras y errores.',
      short: 'Sin datos de clientes. Se manda solo más adelante.',
    },
    code: (code: string, time: string) => `Código ${code} · ${time}`,
    goOn: 'Seguir sin avisar',
    report: 'Avisar y seguir',
    reported: 'Aviso guardado',
    saved: {
      long: 'Aviso guardado. Se manda solo cuando esté Mejoras y errores.',
      short: 'Aviso guardado. Se manda más adelante.',
    },
  },
} as const;

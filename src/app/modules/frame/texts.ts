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
} as const;

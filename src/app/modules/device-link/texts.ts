// Los textos del vínculo (maqueta aprobada de 03, device-link-indicator/final): largos en la
// computadora, que explican; cortos en el celular (00 · R3). Los dos dicen lo mismo.
import type { Words } from '../../ui/say/Say.tsx';

const words = (long: string, short: string): Words => ({ long, short });

// Lo que muestra el indicador de cada estado (R4.1), desde el lado de este dispositivo.
export type Status = 'unpaired' | 'direct' | 'relayed' | 'paused' | 'waiting' | 'offline';
export type Tone = 'neutral' | 'success' | 'urgent' | 'waiting' | 'error';

export const tones: Record<Status, Tone> = {
  unpaired: 'neutral',
  direct: 'success',
  relayed: 'urgent',
  paused: 'neutral',
  waiting: 'waiting',
  offline: 'error',
};

export const texts = {
  label: {
    unpaired: words('Sin vincular', 'Sin vincular'),
    direct: words('Directo', 'Directo'),
    relayed: words('Por el servidor', 'Por el servidor'),
    paused: words('Desconectado', 'Desconectado'),
    offline: words('Sin internet', 'Sin internet'),
  },
  // Esperando al otro: el que espera dice a quién (en la pastilla del celular, corto).
  waitingFor: {
    computer: words('Esperando al celular', 'Esperando'),
    phone: words('Esperando a la computadora', 'Esperando'),
  },
  tapToPair: 'Tocalo para vincular',
  open: (label: string, other: string | undefined) =>
    `${label}${other ? `, con ${other}` : ''}. Ver el vínculo`,
};

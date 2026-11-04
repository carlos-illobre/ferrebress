// Lo que el indicador y el detalle muestran de un estado del vínculo (diseño de 03, § 8.1): el estado
// para la persona, su tono, con qué está vinculado y quién es este lado. Puro, sin pantallas.
import type { PairingView, Side } from '@ferrebress/shared/contracts/pairing';
import type { PairingState } from './machine/types.ts';
import { type Status, type Tone, tones } from './texts.ts';

export type LinkView = {
  status: Status;
  tone: Tone;
  // Con qué está vinculado (lista cerrada del servidor), si hay vínculo.
  other: string | undefined;
  side: Side | undefined;
  pairing: PairingView | undefined;
  // Probando el directo desde el respaldo, o «No se pudo» (R3.3, E19).
  probe: 'trying' | 'failed' | undefined;
  // Sin mostrar: sin sesión, o con la pestaña oculta.
  hidden: boolean;
};

const statusOf: Record<PairingState['kind'], Status> = {
  asleep: 'unpaired',
  unpaired: 'unpaired',
  waiting: 'waiting',
  meeting: 'waiting',
  away: 'waiting',
  direct: 'direct',
  relayed: 'relayed',
  paused: 'paused',
  offline: 'offline',
};

export function viewOf(state: PairingState): LinkView {
  const status = statusOf[state.kind];
  const pairing = 'pairing' in state ? state.pairing : undefined;
  return {
    status,
    tone: tones[status],
    other: pairing?.other.label,
    side: pairing?.side,
    pairing,
    probe: state.kind === 'relayed' ? state.probe : undefined,
    hidden: state.kind === 'asleep',
  };
}

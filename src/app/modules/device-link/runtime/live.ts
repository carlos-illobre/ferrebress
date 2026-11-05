// Lo que el vínculo tiene vivo en esta pestaña (diseño de 03, § 2.2): los transportes, el tema que
// escucha y lo que llegó antes de tiempo. La máquina de estados guarda solo datos; esto guarda los
// objetos, y lo usan los que corren los comandos. Sus dependencias llegan de afuera: las pruebas le
// dan un servidor, un canal y un WebRTC de mentira.
import type { PairingView } from '@ferrebress/shared/contracts/device-link';
import type { Mirror, Patch } from '../../../platform/mirror/registry.ts';
import type { Direct } from '../../../platform/peer/direct.ts';
import type { RtcConnection } from '../../../platform/peer/rtc.ts';
import type { Transport } from '../../../platform/peer/transport.ts';
import type { TopicHandler } from '../../../platform/realtime/demand.ts';
import type { api } from '../../../platform/server/api.ts';
import type { Store } from '../../../platform/store.ts';
import type { Confirm } from '../confirm.ts';
import type { Journal } from '../journal.ts';
import type { Attempt, PairingEvent, PairingState } from '../machine/types.ts';
import type { Strip } from '../strip.ts';
import type { Snap, WireMessage } from '../wire.ts';

export type Deps = {
  api: typeof api;
  // Pedir un tema del canal común; devuelve cómo dejar de pedirlo.
  want(token: string, handler: TopicHandler): () => void;
  mirror: Mirror;
  rtc(): Promise<RtcConnection>;
  online: Store<boolean>;
  appVersion: string;
  // Si el servidor ya dijo que hay una versión más nueva que la de esta pestaña (00 · R5.1).
  outdated(): boolean;
  journal: Journal;
  // La tira de la persona de ahora, si hay alguien.
  strip(): Strip | undefined;
};

// Una conexión con el otro: su intento, su transporte, el directo si lo es y la huella del otro.
export type Link = {
  attempt: Attempt;
  transport: Transport;
  direct?: Direct;
  peerFingerprint?: string;
  // Junta las partes de la foto que llegan por esta conexión.
  assemble(snap: Snap): Patch[] | undefined;
  stop(): void;
};

export type Live = {
  deps: Deps;
  confirm: Confirm;
  state(): PairingState;
  dispatch(event: PairingEvent): void;
  // Lo que corre en orden con los pasos de la máquina (lo que entra por el espejo).
  enqueue(run: () => void | Promise<void>): void;
  // Preguntarle al servidor cómo está el vínculo; lo que diga entra a la máquina.
  check(): Promise<void>;
  topic?: { stop(): void; peeking: boolean } | undefined;
  // El que espeja; el directo que se está abriendo (al presentarse o al probar); el dormido.
  current?: Link | undefined;
  opening?: Link | undefined;
  dormant?: (Link & { timer: ReturnType<typeof setTimeout> }) | undefined;
  // La oferta que llegó antes que el celular la esperara.
  offer?: { attempt: Attempt; sdp: string } | undefined;
  // Lo que llegó por el servidor antes de abrir el respaldo, y a quién dárselo después.
  relayInbox: unknown[][];
  relayReceiver?: ((batch: unknown[]) => void) | undefined;
  // Por qué no abrió el último directo, para el aviso al servidor (§ 15.2): solo números.
  failedIce: IceReport;
  // El saludo del otro en esta conexión, y quienes lo esperan (la foto necesita su reloj).
  hello?: Extract<WireMessage, { t: 'hello' }> | undefined;
  helloWaiters: ((hello: Extract<WireMessage, { t: 'hello' }> | undefined) => void)[];
};

export type IceReport = {
  host: number;
  mdns: number;
  pairs: number;
  state: RTCIceConnectionState;
};

export const pairingToken = (pairing: PairingView) => `device-link.pairing:${pairing.id}`;
export const isComputerHere = (live: Live) => {
  const state = live.state();
  return 'pairing' in state && state.pairing.side === 'computer';
};

// Cierra una conexión: deja de escucharla y la cierra (sin avisar a la máquina: es de acá).
export function shut(link: Link | undefined): void {
  if (!link) return;
  link.stop();
  link.transport.close('closed');
}

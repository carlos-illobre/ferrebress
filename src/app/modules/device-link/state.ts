// La máquina de estados del vínculo (diseño de 03, § 8): una función pura, `step(estado, evento)`, que
// devuelve el estado nuevo y los comandos que hay que correr. Los estados guardan solo datos (el
// vínculo, el intento): los transportes vivos los guarda `runtime.ts`, así un estado se puede anotar en
// el diario y volver a correr. Sumar un evento sin decir qué hace no compila (`assertNever`), y un
// evento de un intento que no es el del estado no cambia nada.
import {
  onDirect,
  onPeerBack,
  onPeerGone,
  onPeerPresent,
  onServerSaid,
  onSessionLost,
} from './machine/arrive.ts';
import {
  onDormantLost,
  onInternet,
  onPause,
  onProbe,
  onProbeResult,
  onResume,
  onTabAway,
  onTabBack,
} from './machine/stay.ts';
import { type PairingEvent, type PairingState, type Step, same } from './machine/types.ts';

export * from './machine/types.ts';

const assertNever = (value: never): never => {
  throw new Error(`Evento sin manejar: ${JSON.stringify(value)}`);
};

export function step(state: PairingState, event: PairingEvent): Step {
  switch (event.type) {
    case 'serverSaid':
      return onServerSaid(state, event.pairing);
    case 'sessionLost':
      return onSessionLost(state, event.samePerson);
    case 'peerPresent':
      return onPeerPresent(state, event.attempt);
    case 'peerBack':
      return onPeerBack(state, event.attempt);
    case 'peerGone':
      return onPeerGone(state, event.why, event.attempt);
    case 'directUp':
    case 'directFailed':
      return onDirect(state, event.type, event.attempt);
    case 'relayUp':
      return same(state);
    case 'internetLost':
    case 'internetBack':
      return onInternet(state, event.type === 'internetBack');
    case 'pause':
      return onPause(state, event.from);
    case 'resume':
      return onResume(state, event.from);
    case 'probe':
      return onProbe(state);
    case 'probeResult':
      return onProbeResult(state, event.attempt, event.ok);
    case 'tabAway':
      return onTabAway(state, event.why);
    case 'tabBack':
      return onTabBack(state);
    case 'dormantLost':
      return onDormantLost(state);
    default:
      return assertNever(event);
  }
}

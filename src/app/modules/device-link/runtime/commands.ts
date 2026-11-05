// Lo que hace cada comando de la máquina (diseño de 03, § 8.3), uno por nombre: sumar un comando sin
// decir qué hace no compila. Ninguno tira: lo que falla se anota en el diario.

import { platformSettings } from '../../../platform/settings.ts';
import type { Command } from '../machine/types.ts';
import type { ByeReason } from '../wire.ts';
import { answerOffer, closeTransport, openDirect, openRelayed } from './links.ts';
import { isComputerHere, type Live } from './live.ts';
import { attachMirror, detachMirror, sendHello, sendSnapshot } from './mirror-port.ts';
import { subscribe, unsubscribe } from './topic.ts';

type Of<K extends Command['do']> = Extract<Command, { do: K }>;
type Runners = { [K in Command['do']]: (live: Live, command: Of<K>) => void | Promise<void> };

const byes = new Set<string>(['hidden', 'signout', 'lost', 'handover', 'replaced', 'unpair']);

// Lo que se le dice al otro: por la conexión que espeja o, al volver la pestaña, por la dormida.
function send(live: Live, message: Of<'send'>['message']): void {
  const link = live.current ?? live.dormant;
  if (message === 'hello') sendHello(live, link);
  else link?.transport.send({ t: message });
}

async function post(live: Live, path: 'pause' | 'resume'): Promise<void> {
  const result = await live.deps.api(`/api/device-link/${path}`, {});
  if (result.ok) return;
  live.deps.journal.note('post-failed', { path, error: result.error });
  if (result.error !== 'offline') await live.check();
}

async function report(live: Live, { attempt, outcome }: Of<'report'>): Promise<void> {
  await live.deps.api('/api/device-link/report', { attempt, outcome, ice: live.failedIce });
}

// Sin internet (§ 8.5): cada intento es la confirmación; el primero que llega da `internetBack`.
function retryInternet(live: Live, tries = 0): void {
  setTimeout(async () => {
    if (live.state().kind !== 'offline') return;
    await live.check();
    retryInternet(live, tries + 1);
  }, platformSettings.reconnect.delaysMs[tries] ?? platformSettings.reconnect.everyMs);
}

export const runners: Runners = {
  subscribe: (live) => subscribe(live, false),
  peek: (live) => subscribe(live, true),
  unsubscribe,
  openDirect: (live, { attempt }) => openDirect(live, attempt, false),
  probeDirect: (live, { attempt }) => openDirect(live, attempt, true),
  awaitOffer: (live) => answerOffer(live),
  openRelayed: (live, { attempt }) => openRelayed(live, attempt),
  closeTransport: (live, { keep }) => closeTransport(live, keep === true),
  bye: (live, { why }) => {
    if (byes.has(why)) live.current?.transport.send({ t: 'bye', why: why as ByeReason });
  },
  send: (live, { message }) => send(live, message),
  // La foto espera al otro y a la confirmación sin frenar la fila (§ 2.2).
  snapshot: (live, { withQueries }) => {
    sendSnapshot(live, withQueries).catch((error: unknown) =>
      live.deps.journal.note('error', { what: String(error).slice(0, 80) }),
    );
  },
  report,
  post: (live, { path }) => post(live, path),
  attachMirror: (live, { over }) => attachMirror(live, over),
  detachMirror: (live, { reset }) => detachMirror(live, reset),
  strip: (live, { mark }) => live.deps.strip()?.mark(mark),
  check: (live) => live.check(),
  retryInternet: (live) => retryInternet(live),
  // Otra versión (R6.7): la cabecera de la respuesta dice cuál es la vieja (00 · R5.1). La de la
  // versión al día vuelve a esperar al otro; la vieja no, hasta actualizarse.
  newVersion: async (live) => {
    await live.check();
    if (!live.deps.outdated()) subscribe(live, !isComputerHere(live));
  },
};

export const run = (live: Live, command: Command) =>
  (runners[command.do] as (live: Live, command: Command) => void | Promise<void>)(live, command);

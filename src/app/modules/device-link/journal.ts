// El diario de la conexión (diseño de 03, § 15.1): cada evento que entra a la máquina, el estado al
// que pasó y los comandos, y cada descarte o espera vencida. Sin datos personales ni del negocio: ni
// nombres ni identificadores (el vínculo va como «el actual» u «otro»), ni valores; de una clave, hasta
// el primer `:`. Las últimas 300 entradas, en memoria, y en el dispositivo al ocultarse la pestaña y
// cada 10 s si cambió: escribir no compite con lo que se ve. Sobrevive a recargar.
import { readStored, store } from '../../platform/device/storage.ts';
import type { Command, PairingEvent, PairingState } from './machine/types.ts';

export const journalSettings = { key: 'device-link.journal', size: 300, flushMs: 10_000 };

// Una entrada: `t` en milisegundos del cronómetro, `e` qué pasó y lo demás, corto y sin personas.
export type Entry = { t: number; e: string; [field: string]: string | number | boolean };

// De una clave del espejo, solo su nombre: `q:users.card.person:42` queda `q:users.card.person`.
export const keyName = (key: string) => {
  const cut = key.indexOf(':', key.startsWith('q:') ? 2 : 0);
  return cut === -1 ? key : key.slice(0, cut);
};

// Lo que se anota de un evento: el tipo y sus datos sin personas (el vínculo, solo si hay o no).
function describe(event: PairingEvent): Record<string, string | boolean> {
  switch (event.type) {
    case 'serverSaid':
      return { p: event.pairing ? (event.pairing.paused ? 'paused' : 'yes') : 'none' };
    case 'sessionLost':
      return { same: event.samePerson };
    case 'peerGone':
      return { w: event.why };
    case 'tabAway':
      return { w: event.why };
    case 'pause':
    case 'resume':
      return { from: event.from };
    case 'probeResult':
      return { a: event.attempt, ok: event.ok };
    default:
      return 'attempt' in event ? { a: event.attempt } : {};
  }
}

type Options = { now?: () => number; every?: (run: () => void, ms: number) => () => void };

const interval = (run: () => void, ms: number) => {
  const id = setInterval(run, ms);
  return () => clearInterval(id);
};

export function createJournal({ now = () => performance.now(), every = interval }: Options = {}) {
  let entries: Entry[] = readStored<Entry[]>(journalSettings.key) ?? [];
  let dirty = false;
  const flush = () => {
    if (!dirty) return;
    dirty = false;
    store(journalSettings.key, entries);
  };
  const add = (entry: Omit<Entry, 't'>) => {
    entries.push({ t: Math.round(now()), ...entry } as Entry);
    if (entries.length > journalSettings.size) entries = entries.slice(-journalSettings.size);
    dirty = true;
  };
  const stop = every(flush, journalSettings.flushMs);
  const onHide = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  document.addEventListener('visibilitychange', onHide);
  return {
    // Un paso de la máquina: el evento con sus datos, el estado nuevo y los comandos.
    step(event: PairingEvent, state: PairingState, commands: Command[], ignored?: true) {
      add({
        e: event.type,
        ...describe(event),
        s: state.kind,
        k: commands.map((command) => command.do).join(','),
        ...(ignored ? { ignored: true } : {}),
      });
    },
    // Un descarte (`unknown-message`, `invalid`, `too-large`) o una espera vencida.
    note(what: string, fields: Record<string, string | number | boolean> = {}) {
      add({ e: what, ...fields });
    },
    entries: () => [...entries],
    flush,
    stop() {
      stop();
      document.removeEventListener('visibilitychange', onHide);
      flush();
    },
  };
}

export type Journal = ReturnType<typeof createJournal>;

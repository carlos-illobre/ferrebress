// La confirmación del vínculo (diseño de 03, § 7): por el directo, nada sale ni entra por el espejo sin
// que el servidor haya dicho, hace menos de 4 minutos, que el vínculo existe y que el otro lado de esta
// conexión (su huella DTLS) sigue con la sesión abierta. Si la última es más vieja, lo que sale y lo que
// entra espera en orden y se confirma; con `gone` o sin vínculo, se tira y avisa. Solo confirma quien
// está en uso: sin nada que mandar ni aplicar no sale ningún pedido (no hay temporizador). Sin internet
// se sigue con la última buena de esta conexión mientras este dispositivo no llegue al servidor, hasta
// 30 minutos (R3.4): después deja de espejar, así cortarle internet a propósito no lo estira sin fin.
import type { CheckResponse, PairingView } from '@ferrebress/shared/contracts/device-link';
import type { ApiResult } from '../../platform/server/api.ts';
import type { PairingEvent } from './machine/types.ts';
import { deviceLinkSettings } from './settings.ts';

export type Verdict = 'ok' | 'gone' | 'none' | 'offline';

type Options = {
  // `GET /api/device-link/check?fp=…`
  check(fingerprint: string): Promise<ApiResult<CheckResponse>>;
  now?: () => number;
  // El otro ya no está en regla, ya no hay vínculo, o pasaron 30 minutos sin poder confirmar: lo
  // recibe la máquina.
  onVerdict(verdict: 'gone' | 'none' | 'stale', pairing: PairingView | undefined): void;
};

// Lo de la conexión de ahora. `generation` cambia con cada una: lo que contesta una confirmación de la
// anterior no toca esta.
type Connection = {
  generation: number;
  fingerprint: string | undefined;
  confirmedAt: number | undefined;
  running: Promise<boolean> | undefined;
  held: (() => void)[];
};

export const verdictOf = (result: ApiResult<CheckResponse>): Verdict => {
  if (!result.ok) return result.error === 'offline' ? 'offline' : 'gone';
  if (!result.data.pairing) return 'none';
  return result.data.peer === 'ok' ? 'ok' : 'gone';
};

// Lo que recibe la máquina de cada veredicto malo. Sin poder confirmar hace 30 minutos (R3.4), deja de
// espejar como si se hubiera perdido la conexión: sin internet, queda «Sin internet».
export const eventOfVerdict = (
  verdict: 'gone' | 'none' | 'stale',
  pairing: PairingView | undefined,
): PairingEvent =>
  verdict === 'none'
    ? { type: 'serverSaid', pairing: pairing ?? null }
    : { type: 'peerGone', why: verdict === 'stale' ? 'lost' : 'signed-out' };

// Preguntarle al servidor por la conexión de ahora, y qué hacer con lo que diga.
async function ask(now: Connection, { check, onVerdict, now: clock }: Required<Options>) {
  const { fingerprint, generation } = now;
  if (fingerprint === undefined) return false;
  const result = await check(fingerprint);
  if (generation !== now.generation) return false;
  const verdict = verdictOf(result);
  if (verdict === 'offline') {
    if (now.confirmedAt === undefined) return false;
    if (clock() - now.confirmedAt < deviceLinkSettings.confirm.offlineMs) return true;
    now.confirmedAt = undefined;
    onVerdict('stale', undefined);
    return false;
  }
  if (verdict === 'ok') {
    now.confirmedAt = clock();
    return true;
  }
  now.confirmedAt = undefined;
  onVerdict(verdict, result.ok ? result.data.pairing : undefined);
  return false;
}

const blank = (generation: number, fingerprint: string | undefined): Connection => ({
  generation,
  fingerprint,
  confirmedAt: undefined,
  running: undefined,
  held: [],
});

export function createConfirm(options: Options) {
  const settings = { now: () => performance.now(), ...options };
  const now = blank(0, undefined);
  const reset = (fingerprint: string | undefined) =>
    void Object.assign(now, blank(now.generation + 1, fingerprint));
  const fresh = (maxAgeMs: number) =>
    now.confirmedAt !== undefined && settings.now() - now.confirmedAt < maxAgeMs;

  // Confirmar si la última es más vieja que `maxAgeMs`; los que piden a la vez esperan la misma.
  const ensure = (maxAgeMs: number): Promise<boolean> => {
    if (fresh(maxAgeMs)) return Promise.resolve(true);
    if (now.running) return now.running;
    const current = ask(now, settings).finally(() => {
      if (now.running === current) now.running = undefined;
    });
    now.running = current;
    return current;
  };

  // Lo retenido sale en orden cuando llega una confirmación buena de esta misma conexión.
  const release = (generation: number) => (ok: boolean) => {
    if (generation !== now.generation) return;
    const waiting = now.held;
    now.held = [];
    if (ok) for (const next of waiting) next();
  };

  return {
    // Una conexión nueva con el otro, con su huella (por el servidor, ninguna: el servidor mira cada
    // lote). La confirmación de antes no vale para esta.
    begin: reset,
    end: () => reset(undefined),
    // Algo del vínculo cambió (la huella `l=`, § 3.5): la última ya no vale, y lo próximo que salga o
    // entre espera una nueva. Lo que trajo el aviso no viaja sin confirmar.
    stale() {
      now.confirmedAt = undefined;
    },
    ensure,
    // Lo que sale o entra por el espejo: ahora si la confirmación está fresca; si no, cuando llegue.
    gate(run: () => void) {
      const open = now.held.length === 0 && fresh(deviceLinkSettings.confirm.maxAgeMs);
      if (now.fingerprint === undefined || open) return run();
      now.held.push(run);
      if (now.held.length === 1)
        void ensure(deviceLinkSettings.confirm.maxAgeMs).then(release(now.generation));
    },
  };
}

export type Confirm = ReturnType<typeof createConfirm>;

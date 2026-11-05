// El lector del SSE (diseño de 03, § 3.2; ADR-017): un pedido leído con fetch, abierto solo mientras
// se espera algo. No usa EventSource, que se reconecta solo cada pocos segundos: si se corta, vuelve a
// abrir solo con la pestaña a la vista y con red, como mucho tres veces con espera creciente; después
// espera a que vuelva la red o la pestaña. Si el servidor dice que se abrió demasiadas veces, espera
// lo que dice. Si en 55 s no llegó nada (el latido es cada 40 s), lo da por cortado y lo vuelve a
// abrir (03 · R7.2). Si el servidor lo rechaza (sin sesión, sin permiso, un pedido mal hecho), no
// insiste: avisa y termina.
import { canReach, watchReach } from '../server/reach.ts';
import { platformSettings } from '../settings.ts';

export type StreamEvent = { type: string; data: unknown };

export type StreamOptions = {
  // Abre el SSE: un pedido que lo devuelve. Se vuelve a llamar en cada reconexión.
  open: (signal: AbortSignal) => Promise<Response>;
  onEvent: (event: StreamEvent) => void;
  // El servidor no lo aceptó (400, 401, 403, 404), con su estado y el código que dijo: no se vuelve
  // a abrir.
  onRefused?: (status: number, code?: string) => void;
  // Cada bloque que llega, con su largo en bytes y su evento (sin evento, un latido): el medidor.
  onBytes?: (bytes: number, type: string | undefined) => void;
  wait?: (ms: number) => Promise<void>;
  // Cuánto silencio se aguanta antes de darlo por cortado.
  silenceMs?: number;
};

const maxRetries = 3;
const refusals = new Set([400, 401, 403, 404]);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Outcome = { waitMs?: number; refused?: number; code?: string };

// Una vez: abre y lee hasta que se corte o calle demasiado. Devuelve si el servidor pidió esperar o
// lo rechazó; `opened` dice si llegó a abrir, así los cortes se empiezan a contar de nuevo.
async function attempt(
  options: StreamOptions,
  signal: AbortSignal,
  opened: () => void,
): Promise<Outcome> {
  const silence = new AbortController();
  try {
    const response = await options.open(AbortSignal.any([signal, silence.signal]));
    if (response.status === 429) return { waitMs: await retryAfterMs(response) };
    if (refusals.has(response.status))
      return { refused: response.status, ...(await refusalCode(response)) };
    if (!response.ok || !response.body) return {};
    opened();
    const awake = watchdog(silence, options.silenceMs ?? platformSettings.realtime.silenceMs);
    const stop = AbortSignal.any([signal, silence.signal]);
    await readEvents(response.body, options, awake, stop);
  } catch {
    // Cortado, o callado: se decide afuera si se vuelve a abrir.
  }
  return {};
}

// Entre un intento y el próximo: lo que pidió el servidor, la espera creciente o, pasados los
// reintentos o sin red, esperar a que vuelvan la red o la vista. Devuelve los cortes seguidos.
async function pause(
  outcome: Outcome,
  failures: number,
  signal: AbortSignal,
  wait: (ms: number) => Promise<void>,
): Promise<number> {
  const ms = delay(outcome.waitMs, failures);
  if (ms !== undefined) {
    await wait(ms);
    return failures;
  }
  await nextChance(signal);
  return 0;
}

// Abre el SSE; devuelve cómo cerrarlo.
export function openStream(options: StreamOptions): () => void {
  const { wait = sleep } = options;
  const controller = new AbortController();
  const { signal } = controller;
  let failures = 0;
  void (async () => {
    while (!signal.aborted) {
      const outcome = await attempt(options, signal, () => (failures = 0));
      if (signal.aborted) return;
      if (outcome.refused !== undefined) return options.onRefused?.(outcome.refused, outcome.code);
      failures = await pause(outcome, failures + 1, signal, wait);
    }
  })();
  return () => controller.abort();
}

// Corta la lectura si pasa ese tiempo sin que llegue nada; devuelve cómo avisar que llegó algo.
function watchdog(silence: AbortController, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => silence.abort(), ms);
  };
  arm();
  return arm;
}

// Cuánto esperar antes de volver a abrir; sin nada, se espera a que vuelva la red o la pestaña.
const delay = (held: number | undefined, failures: number): number | undefined => {
  if (!canReach()) return undefined;
  if (held !== undefined) return held;
  return failures <= maxRetries ? 1000 * 2 ** (failures - 1) : undefined;
};

// El código del rechazo (`forbidden`), si el servidor lo dijo.
const refusalCode = async (response: Response): Promise<{ code?: string }> => {
  const body = (await response.json().catch(() => ({}))) as { error?: unknown };
  return typeof body.error === 'string' ? { code: body.error } : {};
};

const retryAfterMs = async (response: Response) => {
  const body = (await response.json().catch(() => ({}))) as { retryAfterSeconds?: unknown };
  return Math.max(1, Number(body.retryAfterSeconds) || 60) * 1000;
};

// Vuelve la red o la pestaña a la vista.
const nextChance = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const done = () => {
      if (!canReach() && !signal.aborted) return;
      stop();
      signal.removeEventListener('abort', done);
      resolve();
    };
    const stop = watchReach(done);
    signal.addEventListener('abort', done);
  });

// Un bloque de SSE: sus campos; un comentario (el latido) no tiene ninguno.
function fieldsOf(block: string): Record<string, string> {
  return Object.fromEntries(
    block
      .split('\n')
      .map((line) => [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 1).trim()]),
  );
}

const encoder = new TextEncoder();

// Lee los bloques a medida que llegan. Cada bloque se mide en bytes (lo que viajó, no los caracteres).
async function readEvents(
  body: ReadableStream<Uint8Array>,
  { onEvent, onBytes }: StreamOptions,
  awake: () => void,
  stop: AbortSignal,
) {
  const reader = body
    .pipeThrough(new TextDecoderStream() as TransformStream<Uint8Array, string>)
    .getReader();
  // Cerrar o callar corta la lectura aunque el pedido no lo haga solo.
  stop.addEventListener('abort', () => void reader.cancel(), { once: true });
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    awake();
    buffer += value;
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() as string;
    for (const block of blocks) {
      const fields = fieldsOf(block);
      onBytes?.(encoder.encode(block).byteLength + 2, fields.event || undefined);
      if (fields.event && fields.data)
        onEvent({ type: fields.event, data: JSON.parse(fields.data) });
    }
  }
}

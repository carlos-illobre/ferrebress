// El canal temporal (ADR-003): un SSE leído con fetch, abierto solo mientras se espera algo. No
// usa EventSource, que se reconecta solo cada pocos segundos: si se corta, vuelve a abrir solo con
// la pestaña a la vista y con red, como mucho tres veces con espera creciente; después espera a
// que vuelva la red o la pestaña (diseño de 01, § 5).
export type ChannelEvent = { type: string; data: unknown };

export type ChannelOptions = {
  // Abre el canal: un pedido que devuelve el SSE. Se vuelve a llamar en cada reconexión.
  open: (signal: AbortSignal) => Promise<Response>;
  onEvent: (event: ChannelEvent) => void;
  wait?: (ms: number) => Promise<void>;
};

const maxRetries = 3;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const canReconnect = () => document.visibilityState === 'visible' && navigator.onLine;

// Abre el canal; devuelve cómo cerrarlo.
export function openChannel({ open, onEvent, wait = sleep }: ChannelOptions): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  let failures = 0;

  // Una vez: abre y lee hasta que se corte. Si llegó a abrir bien, se empiezan a contar de nuevo
  // los cortes.
  const attempt = async () => {
    try {
      const response = await open(signal);
      if (!response.ok || !response.body) return;
      failures = 0;
      await readEvents(response.body, onEvent);
    } catch {
      // Cortado: se decide afuera si se vuelve a abrir.
    }
  };

  void (async () => {
    while (!signal.aborted) {
      await attempt();
      failures += 1;
      if (signal.aborted) return;
      if (failures <= maxRetries && canReconnect()) await wait(1000 * 2 ** (failures - 1));
      else {
        failures = 0;
        await nextChance(signal);
      }
    }
  })();
  return () => controller.abort();
}

// Vuelve la red o la pestaña a la vista.
const nextChance = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const done = () => {
      if (!canReconnect() && !signal.aborted) return;
      removeEventListener('online', done);
      document.removeEventListener('visibilitychange', done);
      resolve();
    };
    addEventListener('online', done);
    document.addEventListener('visibilitychange', done);
    signal.addEventListener('abort', done);
  });

async function readEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChannelEvent) => void,
) {
  const reader = body
    .pipeThrough(new TextDecoderStream() as TransformStream<Uint8Array, string>)
    .getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() as string;
    for (const block of blocks) {
      const fields = Object.fromEntries(
        block
          .split('\n')
          .map((line) => [
            line.slice(0, line.indexOf(':')),
            line.slice(line.indexOf(':') + 1).trim(),
          ]),
      );
      if (fields.event && fields.data)
        onEvent({ type: fields.event, data: JSON.parse(fields.data) });
    }
  }
}

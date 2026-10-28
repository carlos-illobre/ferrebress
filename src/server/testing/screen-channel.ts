// Para las pruebas de entrar con el celular: abre la pantalla de una computadora y junta los
// avisos que le llegan por el canal, y una forma de esperar que maneja la prueba.
import { appHeaders, testConfig } from './config.ts';
import type { createDevice, SignInServer } from './sign-in-server.ts';

export type ScreenEvent = { type: string; code?: string; permit?: string };

// Esperas que terminan cuando la prueba dice: así el «próximo minuto» llega a mano.
export function manualWait() {
  const pending: (() => void)[] = [];
  return {
    wait: () => new Promise<void>((resolve) => pending.push(resolve)),
    elapse: () => {
      for (const resolve of pending.splice(0)) resolve();
    },
  };
}

// Junta en `events` los avisos que llegan por el canal.
function collect(reader: ReadableStreamDefaultReader<Uint8Array>, events: ScreenEvent[]) {
  let buffer = '';
  const pump = async (): Promise<void> => {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += new TextDecoder().decode(value);
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() as string;
    for (const block of blocks)
      events.push(JSON.parse(block.slice(block.indexOf('data: ') + 6).split('\n')[0] as string));
    return pump();
  };
  void pump();
}

const fromCaddy = { incoming: { socket: { remoteAddress: testConfig.TRUSTED_PROXY } } };

export async function openScreen(server: SignInServer, computer: ReturnType<typeof createDevice>) {
  const opened = await computer.request('/api/sign-in/codes', {});
  const cookie = (opened.cookie as string).split(';')[0] as string;
  const controller = new AbortController();
  const response = await server.http.request('/api/realtime/sign-in-codes', {
    // Como EventSource: sin las cabeceras de la aplicación, solo con la cookie.
    headers: { Cookie: cookie, 'X-Real-IP': '190.1.2.3' },
    signal: controller.signal,
  });
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const events: ScreenEvent[] = [];
  collect(reader, events);
  const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
  await settle();
  const headers = {
    Cookie: cookie,
    Origin: testConfig.PUBLIC_ORIGIN,
    'Content-Type': 'application/json',
    ...appHeaders(computer.id),
  };
  return {
    cookie,
    events,
    settle,
    lastCode: () => [...events].reverse().find((event) => event.type === 'code')?.code as string,
    // Como la pestaña que deja de estar a la vista: corta el canal.
    close: async () => {
      controller.abort();
      await reader.cancel();
      await settle();
    },
    claim: (permit: string) =>
      server.http.request(
        '/api/sign-in/codes/claim',
        {
          method: 'POST',
          body: JSON.stringify({ permit, proofPublicKey: computer.proofPublicKey }),
          headers,
        },
        fromCaddy,
      ),
  };
}

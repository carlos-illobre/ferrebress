// Para las pruebas del vínculo en el servidor: una persona con su computadora y su celular, cada uno
// con su sesión, y una pestaña que abre el canal con los temas del vínculo y junta lo que le llega.
import { appHeaders, testConfig } from './config.ts';
import { manualWait } from './sign-in/screen-channel.ts';
import { chromeWindows, createDevice, type SignInServer } from './sign-in/sign-in-server.ts';

export const androidChrome =
  'Mozilla/5.0 (Linux; Android 14; moto e13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';

export type Device = ReturnType<typeof createDevice>;
export type Received = { event: string; data: Record<string, unknown> };

export const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
export const time = manualWait();

const fromCaddy = { incoming: { socket: { remoteAddress: testConfig.TRUSTED_PROXY } } };

// Una persona de la base con un dispositivo nuevo y su sesión.
export async function signedIn(server: SignInServer, phone: boolean, sub = 'sub-admin') {
  const email = sub === 'sub-admin' ? 'admin@example.com' : `${sub}@example.com`;
  const device = createDevice(server, { userAgent: phone ? androidChrome : chromeWindows });
  await device.signInWithGoogle({ sub, email });
  return device;
}

// Otra persona autorizada (por quien tiene sesión de Administrador) con su celular.
let others = 0;
export async function otherPersonPhone(server: SignInServer, admin: Device) {
  const roles = [(await admin.request('/api/users')).body.roles[0].id];
  const sub = `otra${++others}`;
  await admin.request('/api/users', { email: `${sub}@example.com`, roles });
  return signedIn(server, true, sub);
}

function take(block: string, received: Received[]) {
  const event = /^event: (.*)$/m.exec(block)?.[1];
  const data = /^data: (.*)$/m.exec(block)?.[1];
  if (event && data) received.push({ event, data: JSON.parse(data) });
}

// Abre el canal con esos temas desde ese dispositivo y junta los eventos.
export async function listen(server: SignInServer, device: Device, ...topics: string[]) {
  const received: Received[] = [];
  const controller = new AbortController();
  const response = await server.http.request(
    `/api/realtime?${topics.map((t) => `s=${encodeURIComponent(t)}`).join('&')}`,
    {
      headers: { ...appHeaders(device.id), 'User-Agent': device.userAgent, Cookie: device.cookie },
      signal: controller.signal,
    },
    fromCaddy,
  );
  const reader = response.body?.getReader();
  void (async () => {
    let buffer = '';
    for (;;) {
      const chunk = await reader?.read();
      if (!chunk || chunk.done) return;
      buffer += new TextDecoder().decode(chunk.value);
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() as string;
      for (const block of blocks) take(block, received);
    }
  })();
  await settle();
  return {
    status: response.status,
    received,
    last: (event: string) => [...received].reverse().find((r) => r.event === event)?.data,
    close: async () => {
      controller.abort();
      await reader?.cancel();
      await settle();
    },
  };
}

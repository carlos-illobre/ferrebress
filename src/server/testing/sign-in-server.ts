// Un servidor con personas y entrar, y lo que necesita una prueba para hablarle como la
// aplicación: el origen, el dispositivo, la llave de prueba y la cookie de la sesión.
import { generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { createServer } from '../app.ts';
import { createSignInModule } from '../modules/sign-in/index.ts';
import { createUsersModule } from '../modules/users/index.ts';
import type { Clock } from '../platform/clock.ts';
import { testConfig } from './config.ts';
import { createTestGoogle } from './google.ts';

export const chromeWindows =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

export async function createSignInServer(clock?: Clock) {
  const google = await createTestGoogle(testConfig.GOOGLE_CLIENT_ID);
  const { module: usersModule, users } = createUsersModule();
  const jobs: (() => void)[] = [];
  const schedule = (_: number, run: () => void) => {
    jobs.push(run);
    return () => {};
  };
  const modules = [usersModule, createSignInModule({ users, googleKeys: google.keys })];
  const server = await createServer(testConfig, modules, { ...(clock && { clock }), schedule });
  // Corre ya los trabajos periódicos, como si hubiera pasado su tiempo.
  const runJobs = async () => {
    for (const job of jobs) job();
    await new Promise((resolve) => setTimeout(resolve, 50));
  };
  return { ...server, users, google, runJobs };
}

export type SignInServer = Awaited<ReturnType<typeof createSignInServer>>;

type Device = { id: string; cookie: string };

// Un pedido como lo hace la aplicación, desde Caddy, que anota la cookie que le devuelve el servidor.
async function request(
  server: SignInServer,
  device: Device,
  agent: { userAgent: string; ip: string },
  path: string,
  body?: unknown,
) {
  const headers: Record<string, string> = {
    'X-Device-Id': device.id,
    ...(agent.userAgent && { 'User-Agent': agent.userAgent }),
    'X-Forwarded-For': agent.ip,
    ...(device.cookie && { Cookie: device.cookie }),
  };
  const post = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { ...headers, Origin: testConfig.PUBLIC_ORIGIN, 'Content-Type': 'application/json' },
  };
  const fromCaddy = { incoming: { socket: { remoteAddress: testConfig.TRUSTED_PROXY } } };
  const response = await server.http.request(
    path,
    body === undefined ? { headers } : post,
    fromCaddy,
  );
  const cookie = response.headers.get('Set-Cookie');
  if (cookie) device.cookie = cookie.includes('Max-Age=0') ? '' : (cookie.split(';')[0] as string);
  return { status: response.status, body: await response.json(), cookie };
}

// Un dispositivo: su identificador, su llave de prueba y la cookie que le dio el servidor.
export function createDevice(
  server: SignInServer,
  { userAgent = chromeWindows, ip = '190.1.2.3' } = {},
) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const device = {
    id: randomUUID(),
    cookie: '',
    proofPublicKey: publicKey.export({ format: 'der', type: 'spki' }).toString('base64url'),
    prove: (message: string) =>
      sign('sha256', Buffer.from(message), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString(
        'base64url',
      ),
    request: (path: string, body?: unknown) =>
      request(server, device, { userAgent, ip }, path, body),
    // Abre la aplicación y entra con Google con estos datos del pase.
    async signInWithGoogle(claims: Record<string, unknown>) {
      const start = await device.request('/api/start');
      const credential = await server.google.credential({
        nonce: start.body.googleNonce,
        ...claims,
      });
      return device.request('/api/sign-in/google', {
        credential,
        proofPublicKey: device.proofPublicKey,
      });
    },
  };
  return device;
}

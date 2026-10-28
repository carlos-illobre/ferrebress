// Levanta una sola vez, para todas las pruebas de punta a punta, lo mismo que producción: la
// aplicación armada detrás de Caddy y el servidor, con la base en memoria y un emisor de Google de
// prueba (ENVIRONMENT=e2e). Devuelve cómo apagarlo todo.
import { execFile, spawn } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { type AddressInfo, createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { exportJWK, generateKeyPair } from 'jose';
import { startCaddy } from './caddy.ts';

const root = join(import.meta.dirname, '../../..');
export const adminEmail = 'admin@e2e.test';
export const clientId = 'e2e-client';

const freePort = () =>
  new Promise<number>((resolve) => {
    const probe = createNetServer().listen(0, () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });

// El emisor de Google de prueba: publica su llave; la privada queda para que las pruebas firmen.
async function startGoogle(): Promise<{ server: Server; issuer: string; privateJwk: string }> {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const keys = JSON.stringify({
    keys: [{ ...(await exportJWK(publicKey)), kid: 'e2e', alg: 'RS256' }],
  });
  const port = await freePort();
  const server = createServer((_, response) => response.end(keys)).listen(port);
  return {
    server,
    issuer: `http://127.0.0.1:${port}`,
    privateJwk: JSON.stringify(await exportJWK(privateKey)),
  };
}

// La aplicación armada, con el script de Google de prueba en su propio origen.
async function buildApp(dir: string): Promise<void> {
  const app = join(dir, 'app');
  await promisify(execFile)(
    'pnpm',
    ['--filter', '@ferrebress/app', 'exec', 'vite', 'build', '--outDir', app],
    {
      cwd: root,
      env: { ...process.env, VERSION: 'e2e' },
    },
  );
  cpSync(join(import.meta.dirname, 'google-client.js'), join(dir, 'app/e2e-google.js'));
}

async function waitFor(url: string): Promise<void> {
  for (let tries = 0; tries < 100; tries++) {
    const ok = await fetch(url).then(
      (response) => response.ok,
      () => false,
    );
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`No arrancó: ${url}`);
}

// biome-ignore lint/style/noDefaultExport: Playwright toma el arranque común (globalSetup) de la exportación por omisión.
export default async function start(): Promise<() => Promise<void>> {
  const dir = mkdtempSync(join(tmpdir(), 'ferrebress-e2e-'));
  mkdirSync(join(dir, 'audit'));
  const [google, port, serverPort] = await Promise.all([startGoogle(), freePort(), freePort()]);
  const origin = `http://localhost:${port}`;
  const server = spawn('node', ['src/server/main.ts'], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: {
      ...process.env,
      ENVIRONMENT: 'e2e',
      VERSION: 'e2e',
      PORT: String(serverPort),
      PUBLIC_ORIGIN: origin,
      DATABASE_URL: 'memory://',
      AUDIT_PATH: join(dir, 'audit'),
      GOOGLE_CLIENT_ID: clientId,
      GOOGLE_ISSUER: google.issuer,
      GOOGLE_JWKS_URL: google.issuer,
      GOOGLE_SCRIPT_URL: `${origin}/e2e-google.js`,
      INITIAL_ADMIN_EMAIL: adminEmail,
      TRUSTED_PROXY: '127.0.0.1',
    },
  });
  // El servidor arranca mientras se arma la aplicación: es lo que más tarda.
  await buildApp(dir);
  const stopCaddy = startCaddy({ dir, port, serverPort });
  await waitFor(`${origin}/api/health`);
  Object.assign(process.env, {
    E2E_ORIGIN: origin,
    E2E_GOOGLE_ISSUER: google.issuer,
    E2E_GOOGLE_KEY: google.privateJwk,
  });
  return async () => {
    stopCaddy();
    // El servidor escribe la auditoría al cerrarse: la carpeta se borra recién cuando terminó.
    const exited = new Promise((resolve) => server.once('exit', resolve));
    server.kill();
    await exited;
    google.server.close();
    rmSync(dir, { recursive: true, force: true });
  };
}

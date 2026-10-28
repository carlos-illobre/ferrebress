// El servidor de las pruebas de captura: la aplicación armada y una API de mentira que siempre
// contesta lo mismo (sin sesión, el mismo código QR y el Google de prueba), para que cada captura
// salga idéntica. No hace falta el servidor de verdad ni Docker.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

const root = join(import.meta.dirname, '../..');
const port = Number(process.env.SCREENS_PORT);
const app = join(mkdtempSync(join(tmpdir(), 'ferrebress-screens-')), 'app');

// Vite directo, sin pnpm: la imagen de Playwright donde corren no lo trae.
const vite = join(root, 'src/app/node_modules/vite/bin/vite.js');
execFileSync(process.execPath, [vite, 'build', '--outDir', app], {
  cwd: join(root, 'src/app'),
  env: { ...process.env, VERSION: 'screens' },
  stdio: 'ignore',
});
cpSync(join(import.meta.dirname, 'google-button.js'), join(app, 'google-button-screens.js'));

const start = {
  environment: 'testing',
  version: 'screens',
  googleClientId: 'screens',
  googleScriptUrl: '/google-button-screens.js',
  googleNonce: 'screens',
};
const types: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

const json = (response: ServerResponse, body: unknown, status = 200) => {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
};

function file(response: ServerResponse, path: string): void {
  const found = join(app, path);
  const served = existsSync(found) && statSync(found).isFile() ? found : join(app, 'index.html');
  response.writeHead(200, { 'content-type': types[extname(served)] ?? 'application/octet-stream' });
  response.end(readFileSync(served));
}

createServer((request, response) => {
  const path = new URL(String(request.url), 'http://screens').pathname;
  if (path === '/api/start') return json(response, start);
  if (path === '/api/sign-in/codes') return json(response, {});
  if (path === '/api/realtime/sign-in-codes') {
    response.writeHead(200, { 'content-type': 'text/event-stream' });
    return response.write('event: code\ndata: {"code":"captura-fija"}\n\n');
  }
  if (path.startsWith('/api/')) return json(response, { error: 'not-found' }, 404);
  file(response, path);
}).listen(port);

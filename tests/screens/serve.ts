// El servidor de las pruebas de captura: la aplicación armada y una API de mentira que siempre
// contesta lo mismo (sin sesión, el mismo código QR y el Google de prueba), para que cada captura
// salga idéntica. No hace falta el servidor de verdad ni Docker.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
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

// Lo que dice cada tema del canal común (diseño de 03, § 3): el código QR de la entrada, el de
// vincular y el vínculo. Qué dice el vínculo lo elige la escena con la cookie `link-scene`: solo
// (nadie del otro lado), presentados, o presentados con la oferta de la computadora (el celular la
// responde). Las escenas que no la ponen ven el vínculo solo.
const attempt = '0a1b2c3d';
const offer = [
  'v=0',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
  'c=IN IP4 0.0.0.0',
  'a=fingerprint:sha-256 AA:BB:CC',
  'a=candidate:1 1 udp 2122260223 captura.local 5000 typ host',
].join('\r\n');
function eventsOf(token: string, scene: string): string[] {
  const topic = token.split(':')[0];
  if (topic === 'sign-in.codes') return ['{"type":"code","code":"captura-fija"}'];
  if (topic === 'device-link.code') return ['{"code":"captura-vincular"}'];
  if (topic !== 'device-link.pairing') return [];
  if (scene === 'alone') return ['{"present":false}'];
  const present = `{"present":true,"attempt":"${attempt}"}`;
  if (scene !== 'offer') return [present];
  return [present, JSON.stringify({ signal: { attempt, kind: 'offer', sdp: offer } })];
}
const sceneOf = (cookie: string | undefined) =>
  /link-scene=(\w+)/.exec(cookie ?? '')?.[1] ?? 'alone';
const write = (stream: ServerResponse, tokens: string[], scene: string) => {
  for (const token of tokens)
    for (const data of eventsOf(token, scene))
      stream.write(`event: ${token.split(':')[0]}\ndata: ${data}\n\n`);
};
// Los canales abiertos y sus temas, para mandarles lo de un tema que se suma después.
const channels = new Map<string, { stream: ServerResponse; scene: string; tokens: Set<string> }>();

function realtime(request: IncomingMessage, response: ServerResponse, url: URL): void {
  const id = `c${channels.size}`.padEnd(22, 'c');
  const scene = sceneOf(request.headers.cookie);
  const tokens = url.searchParams.getAll('s');
  channels.set(id, { stream: response, scene, tokens: new Set(tokens) });
  response.writeHead(200, { 'content-type': 'text/event-stream' });
  response.write(`event: hello\ndata: {"channel":"${id}"}\n\n`);
  write(response, tokens, scene);
}

// Para el guion de un clip: un evento a todos los canales que escuchan ese tema.
function push(response: ServerResponse, url: URL): void {
  const topic = String(url.searchParams.get('topic'));
  for (const { stream, tokens } of channels.values())
    if ([...tokens].some((token) => token.split(':')[0] === topic))
      stream.write(`event: ${topic}\ndata: ${url.searchParams.get('data')}\n\n`);
  json(response, { ok: true });
}

function subscriptions(request: IncomingMessage, response: ServerResponse): void {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
  });
  request.on('end', () => {
    const asked = JSON.parse(body || '{}') as { channel?: string; add?: string[] };
    const open = channels.get(String(asked.channel));
    if (!open) return json(response, { error: 'not-found' }, 404);
    for (const token of asked.add ?? []) open.tokens.add(token);
    json(response, { listening: asked.add ?? [] });
    write(open.stream, asked.add ?? [], open.scene);
  });
}

createServer((request, response) => {
  const url = new URL(String(request.url), 'http://screens');
  const path = url.pathname;
  if (path === '/api/start') return json(response, start);
  if (path === '/api/sign-in/codes') return json(response, {});
  // El `nonce` que firma la llave del dispositivo antes de abrir una sesión (diseño de 01, § 6).
  if (path === '/api/sign-in/device-nonce') return json(response, { nonce: 'n' });
  if (path === '/api/realtime') return realtime(request, response, url);
  if (path === '/api/realtime/subscriptions') return subscriptions(request, response);
  if (path === '/__push') return push(response, url);
  if (path.startsWith('/api/')) return json(response, { error: 'not-found' }, 404);
  file(response, path);
  // Solo para esta máquina: ni la red local ni Tailscale lo ven mientras corre.
}).listen(port, '127.0.0.1');

// Caddy de las pruebas de punta a punta: la misma imagen y el mismo Caddyfile que producción
// (deploy/), con su puerto, el servidor local y la aplicación armada. Corre en Docker, en la red de
// la máquina, para llegar al servidor y que el navegador llegue a él.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// La imagen, la misma que la de producción, fijada por su huella en web.Dockerfile.
const dockerfile = readFileSync(
  join(import.meta.dirname, '../../../deploy/web.Dockerfile'),
  'utf8',
);
const image = (dockerfile.match(/^FROM (caddy:\S+)/m) as RegExpMatchArray)[1] as string;

export function startCaddy(options: { dir: string; port: number; serverPort: number }): () => void {
  const source = readFileSync(join(import.meta.dirname, '../../../deploy/Caddyfile'), 'utf8');
  const caddyfile = source
    .replace(':80 {', `:${options.port} {`)
    .replace('reverse_proxy server:3000', `reverse_proxy 127.0.0.1:${options.serverPort}`);
  if (caddyfile === source) throw new Error('El Caddyfile cambió: revisar startCaddy');
  writeFileSync(join(options.dir, 'Caddyfile'), caddyfile);
  const name = `ferrebress-e2e-${options.port}`;
  execFileSync('docker', [
    'run',
    '--rm',
    '--detach',
    '--name',
    name,
    '--network',
    'host',
    '--volume',
    `${join(options.dir, 'Caddyfile')}:/etc/caddy/Caddyfile:ro`,
    '--volume',
    `${join(options.dir, 'app')}:/srv:ro`,
    image,
  ]);
  return () => execFileSync('docker', ['rm', '--force', name], { stdio: 'ignore' });
}

// Qué es código fuente para los controles de carpetas y de comentarios (constitución, XII):
// las carpetas de código y los archivos de configuración de la raíz. La documentación, no.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles } from './files.ts';

const codeFolders = ['src', 'tools', 'deploy', '.github/workflows'];
const extensions = ['.ts', '.tsx', '.js', '.cjs', '.css', '.html', '.sh', '.yml', '.yaml'];
const extensionless = ['Dockerfile', 'Caddyfile', '.caddy', '.service', '.env.example'];
const generated = new Set(['pnpm-lock.yaml']);
const isCode = (name: string) =>
  !generated.has(name) && [...extensions, ...extensionless].some((end) => name.endsWith(end));
export const isTest = (path: string) => /\.test\.tsx?$/.test(path);

export function listSourceCode(root: string): string[] {
  const inFolders = codeFolders
    .filter((dir) => existsSync(join(root, dir)))
    .flatMap((dir) => listFiles(root, dir, ['']).filter((path) => isCode(path)));
  const atRoot = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isCode(entry.name))
    .map((entry) => entry.name);
  return [...atRoot, ...inFolders];
}

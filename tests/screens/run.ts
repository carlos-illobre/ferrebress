// Corre las pruebas de captura siempre en la imagen de Playwright de Docker, la de las capturas de
// referencia: fuera de ella las letras se dibujan apenas distinto y la comparación fallaría sin
// que la pantalla haya cambiado. Dentro de la imagen (como en GitHub) corre directo; fuera, se
// relanza en Docker. Los argumentos pasan tal cual (por ejemplo, --update-snapshots).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const image =
  'mcr.microsoft.com/playwright:v1.56.1-noble@sha256:f1e7e01021efd65dd1a2c56064be399f3e4de00fd021ac561325f2bfbb2b837a';
const root = join(import.meta.dirname, '../..');
// `--config <archivo>` corre otra configuración en la misma imagen (las capturas del manual).
const given = process.argv.slice(2);
const [config, args] =
  given[0] === '--config'
    ? [given[1] as string, given.slice(2)]
    : ['tests/screens/playwright.config.ts', given];
const inImage = existsSync('/ms-playwright');
// Lo que elige qué hacen las capturas del manual pasa también a Docker.
const passed = ['MANUAL_CHECK'].flatMap((name) =>
  process.env[name] ? ['-e', `${name}=${process.env[name]}`] : [],
);

const run = inImage
  ? spawnSync('npx', ['playwright', 'test', '-c', config, ...args], {
      cwd: root,
      stdio: 'inherit',
    })
  : spawnSync(
      'docker',
      [
        'run',
        '--rm',
        '--network',
        'host',
        '-v',
        `${root}:/repo`,
        '-w',
        '/repo',
        ...passed,
        image,
        'node',
        'tests/screens/run.ts',
        ...given,
      ],
      { stdio: 'inherit' },
    );
process.exit(run.status ?? 1);

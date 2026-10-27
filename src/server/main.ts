// Arranca el servidor con el .env. Queda fuera de la cobertura: solo conecta lo que se prueba
// en app.ts con el proceso (vitest.config.ts).
import { serve } from '@hono/node-server';
import { createServer } from './app.ts';
import { readConfig } from './platform/config.ts';

const config = readConfig(process.env);
const { http, close } = await createServer(config, []);
const server = serve({ fetch: http.fetch, port: config.PORT });

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => server.close(() => void close()));
}

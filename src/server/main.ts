// Arranca el servidor con el .env y conecta cada módulo con lo que necesita, también los
// adaptadores, que solo se conectan acá. Queda fuera de la cobertura: lo que arma se prueba en
// app.ts y en cada módulo (vitest.config.ts).
import { serve } from '@hono/node-server';
import { openDbIpCities } from './adapters/geo-dbip/index.ts';
import { createServer } from './app.ts';
import { createSignInModule } from './modules/sign-in/index.ts';
import { createUsersModule } from './modules/users/index.ts';
import { readConfig } from './platform/config.ts';

const config = readConfig(process.env);
const { module: users, users: usersFacade } = createUsersModule();
const findCity = await openDbIpCities(config.GEO_DATABASE_PATH);
const signIn = createSignInModule({ users: usersFacade, findCity });
const { http, close } = await createServer(config, [users, signIn]);
const server = serve({ fetch: http.fetch, port: config.PORT });

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => server.close(() => void close()));
}

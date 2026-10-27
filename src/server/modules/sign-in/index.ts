// La fachada de entrar (diseño de 01): registra sus rutas, cierra las sesiones de quien se da de
// baja, escribe por tandas los últimos usos y limpia una vez por día las sesiones viejas.
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import type { ServerModule } from '../../platform/modules.ts';
import type { Users } from '../users/index.ts';
import { registerComputerRoutes } from './codes/computer-routes.ts';
import { registerPhoneRoutes } from './codes/phone-routes.ts';
import { createContext } from './context.ts';
import { registerGoogleRoutes } from './google/routes.ts';
import { createSignIn } from './migrations/001-sign-in.ts';
import { registerLinkRoutes } from './passkeys/link-routes.ts';
import { registerPasskeySignInRoutes } from './passkeys/sign-in-routes.ts';
import { registerSessionRoutes } from './sessions/routes.ts';
import { signInSettings } from './settings.ts';

export type SignInOptions = {
  users: Users;
  // Las llaves de Google; en las pruebas, las de un emisor de prueba.
  googleKeys?: JWTVerifyGetKey;
  // Cómo esperar el próximo código; las pruebas lo manejan a mano.
  wait?: (ms: number) => Promise<void>;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms).unref());

export function createSignInModule(options: SignInOptions): ServerModule {
  const { users, googleKeys, wait = sleep } = options;
  return {
    name: 'sign-in',
    schema: { schema: 'sign_in', migrations: { '001-sign-in': createSignIn } },
    register(platform) {
      const { config } = platform;
      const keys = googleKeys ?? createRemoteJWKSet(new URL(config.GOOGLE_JWKS_URL));
      const google = { clientId: config.GOOGLE_CLIENT_ID, issuer: config.GOOGLE_ISSUER, keys };
      const ctx = createContext(platform, { users, google, wait });
      registerGoogleRoutes(ctx);
      registerSessionRoutes(ctx);
      registerLinkRoutes(ctx);
      registerPasskeySignInRoutes(ctx);
      registerComputerRoutes(ctx);
      registerPhoneRoutes(ctx);
      platform.events.on('user.deactivated', ({ userId }, trx) =>
        ctx.store.closeForUser(trx, userId, 'deactivated'),
      );
      platform.every(signInSettings.lastUsedFlushMs, ctx.store.flush);
      platform.every(signInSettings.cleanupEveryMs, ctx.store.cleanUp);
      platform.onClose(ctx.store.flush);
    },
  };
}

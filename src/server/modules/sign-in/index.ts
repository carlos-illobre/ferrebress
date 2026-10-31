// La fachada de entrar (diseño de 01): registra sus rutas, cierra las sesiones de quien se da de
// baja, escribe por tandas los últimos usos y limpia una vez por día las sesiones viejas.
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import type { ServerModule } from '../../platform/modules.ts';
import type { AccessCounts, Users } from '../users/index.ts';
import { registerConfirmRoutes } from './access/confirm.ts';
import { countsOf } from './access/counts.ts';
import { registerAccessRoutes } from './access/routes.ts';
import { registerComputerRoutes } from './codes/computer/computer-routes.ts';
import { registerPhoneRoutes } from './codes/phone/phone-routes.ts';
import { createContext, type SignInContext } from './context.ts';
import { registerGoogleRoutes } from './google/routes.ts';
import { createSignIn } from './migrations/001-sign-in.ts';
import { createOffline } from './migrations/002-offline.ts';
import { addAccess } from './migrations/003-access.ts';
import { addApproved } from './migrations/004-approved.ts';
import { registerOfflineRoutes } from './offline/routes.ts';
import { offlineSettings } from './offline/rules.ts';
import { registerLinkRoutes } from './passkeys/link-routes.ts';
import { registerPasskeySignInRoutes } from './passkeys/sign-in-routes.ts';
import { requestSession } from './sessions/require.ts';
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

export function createSignInModule(options: SignInOptions) {
  const { users, googleKeys, wait = sleep } = options;
  let ctx: SignInContext;
  const module: ServerModule = {
    name: 'sign-in',
    schema: {
      schema: 'sign_in',
      migrations: {
        '001-sign-in': createSignIn,
        '002-offline': createOffline,
        '003-access': addAccess,
        '004-approved': addApproved,
      },
    },
    register(platform) {
      const { config } = platform;
      const keys = googleKeys ?? createRemoteJWKSet(new URL(config.GOOGLE_JWKS_URL));
      const google = { clientId: config.GOOGLE_CLIENT_ID, issuer: config.GOOGLE_ISSUER, keys };
      ctx = createContext(platform, { users, google, wait });
      platform.sessions.provide((c) => requestSession(ctx, c));
      registerRoutes(ctx);
      listenToUsers(ctx);
      scheduleJobs(ctx, registerOfflineRoutes(ctx));
    },
  };
  // Lo que la lista de Usuarios necesita de las sesiones (diseño de 02, § 3).
  const accessCounts: AccessCounts = (userIds, asking) => countsOf(ctx, userIds, asking);
  return { ...module, accessCounts };
}

function registerRoutes(ctx: SignInContext) {
  registerGoogleRoutes(ctx);
  registerSessionRoutes(ctx);
  registerLinkRoutes(ctx);
  registerPasskeySignInRoutes(ctx);
  registerComputerRoutes(ctx);
  registerPhoneRoutes(ctx);
  registerAccessRoutes(ctx);
  registerConfirmRoutes(ctx);
}

// La baja cierra sus sesiones y borra sus huellas en la misma transacción; la memoria se pone al día
// después de confirmarla. Un nombre nuevo hace olvidar el viejo (02, § 6).
function listenToUsers(ctx: SignInContext) {
  const { events } = ctx.platform;
  events.on('user.deactivated', async ({ userId }, trx) => {
    const closed = await ctx.store.closeForUser(trx, userId, 'deactivated');
    const phones = await ctx.passkeys.removeForUser(trx as never, userId);
    return () => {
      closed();
      ctx.people.forget(userId);
      for (const deviceId of phones) ctx.phoneOwners.delete(deviceId);
    };
  });
  events.on(
    'user.renamed',
    async ({ userId }) =>
      () =>
        ctx.people.forget(userId),
  );
}

function scheduleJobs(ctx: SignInContext, offline: ReturnType<typeof registerOfflineRoutes>) {
  const { platform } = ctx;
  platform.every(signInSettings.lastUsedFlushMs, ctx.store.flush);
  platform.every(signInSettings.cleanupEveryMs, ctx.store.cleanUp);
  platform.every(signInSettings.cleanupEveryMs, () =>
    offline.removeOlderThan(new Date(platform.clock.now().getTime() - offlineSettings.retentionMs)),
  );
  platform.onClose(ctx.store.flush);
}

// La fachada de entrar (diseño de 01): registra sus rutas, cierra las sesiones de quien se da de
// baja, escribe por tandas los últimos usos y limpia una vez por día las sesiones viejas.
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import { sleep } from '../../platform/clock.ts';
import type { ServerModule } from '../../platform/modules.ts';
import type { AccessCounts, Users } from '../users/index.ts';
import { registerConfirmRoutes } from './access/confirm.ts';
import { countsOf } from './access/counts.ts';
import { registerMyAccessRoutes } from './access/me-routes.ts';
import { registerUsersAccessRoutes } from './access/users-routes.ts';
import { defineCodesTopic } from './codes/computer/codes-topic.ts';
import { registerComputerRoutes } from './codes/computer/computer-routes.ts';
import { registerPhoneRoutes } from './codes/phone/phone-routes.ts';
import { createContext, type SignInContext } from './context.ts';
import { registerDeviceRoutes } from './devices/routes.ts';
import { registerGoogleRoutes } from './google/routes.ts';
import { createSignIn } from './migrations/001-sign-in.ts';
import { createOffline } from './migrations/002-offline.ts';
import { addAccess } from './migrations/003-access.ts';
import { addApproved } from './migrations/004-approved.ts';
import { indexPasskeysByUser } from './migrations/005-passkeys-user.ts';
import { addDevices } from './migrations/006-devices.ts';
import { addDeviceKeys } from './migrations/007-device-keys.ts';
import { registerOfflineRoutes } from './offline/routes.ts';
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

// Lo que avisa Entrar, para quien lo necesite sin que Entrar lo conozca (el vínculo, diseño de 03,
// § 11.1): sesiones cerradas desde Usuarios con sus dispositivos, una huella quitada o un celular
// cortado, un dispositivo con otro nombre y un celular que hizo entrar a una computadora.
declare module '../../platform/events.ts' {
  interface ServerEvents {
    'sessions.revoked': { userId: string; deviceIds: string[] };
    'passkey.removed': { userId: string; deviceId: string; cause: 'removed' | 'cut' };
    // Se puso, cambió o borró (nulo) el nombre de un dispositivo (04 · R9).
    'device.renamed': { deviceId: string; name: string | null };
    'sign-in.phone-approved': {
      userId: string;
      phoneDeviceId: string;
      phoneLabel: string;
      computerDeviceId: string;
      computerLabel: string;
    };
  }
}

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
        '005-passkeys-user': indexPasskeysByUser,
        '006-devices': addDevices,
        '007-device-keys': addDeviceKeys,
      },
    },
    async register(platform) {
      const { config } = platform;
      const keys = googleKeys ?? createRemoteJWKSet(new URL(config.GOOGLE_JWKS_URL));
      const google = { clientId: config.GOOGLE_CLIENT_ID, issuer: config.GOOGLE_ISSUER, keys };
      ctx = createContext(platform, { users, google, wait });
      platform.sessions.provide(
        (c) => requestSession(ctx, c),
        (id) => ctx.store.isOpen(id),
      );
      await ctx.devices.load();
      platform.devices.provide(ctx.devices.nameOf);
      ctx.store.onUsed(ctx.devices.touch);
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
  defineCodesTopic(ctx);
  registerPhoneRoutes(ctx);
  registerUsersAccessRoutes(ctx);
  registerMyAccessRoutes(ctx);
  registerConfirmRoutes(ctx);
  registerDeviceRoutes(ctx);
}

// La baja cierra sus sesiones y borra sus huellas en la misma transacción; la memoria se pone al día
// después de confirmarla. Un nombre nuevo hace olvidar el viejo (02, § 6), y un cambio de roles, lo
// que podía (02, § 17).
function listenToUsers(ctx: SignInContext) {
  const { events } = ctx.platform;
  events.on('user.deactivated', async ({ userId }, trx) => {
    const closed = await ctx.store.closeForUser(trx, userId, 'deactivated');
    const phones = await ctx.passkeys.removeForUser(trx as never, userId);
    return () => {
      closed();
      ctx.people.forget([userId]);
      for (const deviceId of phones) ctx.phoneOwners.delete(deviceId);
    };
  });
  // Cambiaron sus roles o los permisos de un rol: la persona de /api/start se arma de nuevo (02 · R7.6).
  events.on(
    'users.permissions-changed',
    async ({ userIds }) =>
      () =>
        ctx.people.forget(userIds),
  );
  events.on(
    'user.renamed',
    async ({ userId }) =>
      () =>
        ctx.people.forget([userId]),
  );
}

function scheduleJobs(ctx: SignInContext, offline: ReturnType<typeof registerOfflineRoutes>) {
  const { platform } = ctx;
  const flush = async () => {
    await ctx.store.flush();
    await ctx.devices.flush();
  };
  platform.every(signInSettings.lastUsedFlushMs, flush);
  platform.every(signInSettings.cleanupEveryMs, async () => {
    await ctx.store.cleanUp();
    await ctx.devices.cleanUp();
  });
  platform.every(signInSettings.cleanupEveryMs, () =>
    offline.removeOlderThan(
      new Date(platform.clock.now().getTime() - signInSettings.offline.retentionMs),
    ),
  );
  platform.onClose(flush);
}

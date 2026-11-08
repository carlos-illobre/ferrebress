// El vínculo entre el celular y la computadora (capítulo 03, diseño de 03): su tabla, sus rutas, sus
// temas del canal común y lo que escucha de otros módulos. Ningún otro módulo lo conoce (ADR-003):
// quitarlo es sacarlo de la lista de módulos.
import type { ServerModule } from '../../platform/modules.ts';
import { createDeviceLinkContext, type DeviceLinkDependencies } from './context.ts';
import { expireDue, flushMirrored } from './expiry.ts';
import { guardRequests } from './guard.ts';
import { listenToOthers } from './listeners.ts';
import { createPairings } from './migrations/001-device-link.ts';
import { registerCodeRoutes } from './routes/codes.ts';
import { registerMeetRoutes } from './routes/meet.ts';
import { registerStateRoutes } from './routes/state.ts';
import { deviceLinkSettings } from './settings.ts';
import { defineTopics } from './topics.ts';

const day = 24 * 60 * 60 * 1000;

export function createDeviceLinkModule(dependencies: DeviceLinkDependencies): ServerModule {
  return {
    name: 'device-link',
    schema: { schema: 'device_link', migrations: { '001-device-link': createPairings } },
    register(platform) {
      const ctx = createDeviceLinkContext(platform, dependencies);
      defineTopics(ctx);
      registerCodeRoutes(ctx);
      registerStateRoutes(ctx);
      registerMeetRoutes(ctx);
      guardRequests(ctx);
      listenToOthers(ctx);
      // La última vez que espejaron, por tandas; y una vez por día, los que vencieron (R2.2).
      platform.every(deviceLinkSettings.flushMirroredEveryMs, () => flushMirrored(ctx));
      platform.onClose(() => flushMirrored(ctx));
      platform.every(day, () => expireDue(ctx));
    },
  };
}

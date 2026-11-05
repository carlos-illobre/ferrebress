// El vínculo entre el celular y la computadora (capítulo 03, diseño de 03): su tabla, sus rutas, sus
// temas del canal común y lo que escucha de otros módulos. Ningún otro módulo lo conoce (ADR-003):
// quitarlo es sacarlo de la lista de módulos.
import type { ServerModule } from '../../platform/modules.ts';
import { createDeviceLinkContext, type DeviceLinkDependencies } from './context.ts';
import { guardRequests } from './guard.ts';
import { afterEnding, recordEnded } from './lifecycle.ts';
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
      const flush = async () => {
        const entries = ctx.members.drainMirrored();
        if (entries.length > 0) await ctx.data.touch(entries);
      };
      platform.every(deviceLinkSettings.flushMirroredEveryMs, flush);
      platform.onClose(flush);
      platform.every(day, async () => {
        const before = new Date(
          platform.clock.now().getTime() - deviceLinkSettings.pairingDays * day,
        );
        const expired = await ctx.data.removeOlderThan(before);
        afterEnding(ctx, expired);
        recordEnded(ctx, expired, 'expired');
      });
    },
  };
}

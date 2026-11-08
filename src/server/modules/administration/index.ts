// La fachada de Administración (capítulo 06, diseño de 06): la tabla de los ajustes, sus rutas y
// `settings()`, los valores de ahora, que leen `sign-in` y `device-link` sin esperar. No conoce a
// quien lo usa: ellos reciben la fachada en server/modules.ts.
import type { Settings } from '@ferrebress/shared/contracts/administration';
import type { ServerModule } from '../../platform/modules.ts';
import { type AdministrationDependencies, createAdministrationContext } from './context.ts';
import { createMemory } from './memory.ts';
import { createSettings } from './migrations/001-settings.ts';
import { noPrices, type PriceRecalculator } from './recalculator.ts';
import { registerRoutes } from './routes.ts';

export type { PriceRecalculator } from './recalculator.ts';
export type Administration = { settings(): Settings };

export function createAdministrationModule(
  dependencies: Omit<AdministrationDependencies, 'recalculator'> & {
    recalculator?: PriceRecalculator;
  },
) {
  const memory = createMemory();
  const module: ServerModule = {
    name: 'administration',
    schema: { schema: 'administration', migrations: { '001-settings': createSettings } },
    async register(platform) {
      const ctx = createAdministrationContext(platform, memory, {
        recalculator: noPrices,
        ...dependencies,
      });
      // Si no se pueden leer o no valen, el servidor no arranca (diseño de 06, § 2).
      memory.load(await ctx.data.all());
      registerRoutes(ctx);
    },
  };
  const administration: Administration = { settings: () => memory.settings() };
  return { module, administration };
}

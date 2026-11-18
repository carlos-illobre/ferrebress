// Lo que comparten las rutas del catálogo: la plataforma, la base, el índice, los pasos de cada ruta
// (anotar y frenar) y lo que le llega de afuera.
import type { CostSource } from '@ferrebress/shared/contracts/catalog';
import type { SearchIndex } from '@ferrebress/shared/search/index';
import type { Context } from 'hono';
import type { Kysely } from 'kysely';
import { createGuards } from '../../../platform/guards.ts';
import type { Platform } from '../../../platform/modules.ts';
import { permissionsOf } from '../../../platform/permissions.ts';
import type { CatalogTables } from '../data.ts';

export type CatalogDependencies = {
  platform: Platform;
  db: Kysely<CatalogTables>;
  index: SearchIndex;
  costSourceOf: (productId: string) => Promise<CostSource | undefined>;
  // El paso del redondeo de ahora, de Administración: para los decimales del precio.
  roundingStep: () => number;
};

export const createRoutesContext = (deps: CatalogDependencies) => ({
  ...deps,
  ...createGuards(deps.platform, { topic: 'catalog', window: { max: 1, windowMs: 60_000 } }),
});

export type CatalogContext = ReturnType<typeof createRoutesContext>;

// Si quien pide ve los costos (R4.1).
export const seesCosts = (c: Context) => permissionsOf(c).includes('price-lists.costs');

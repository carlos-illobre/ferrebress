// Lo que comparten las piezas de las listas de precios en el servidor: la plataforma, las fachadas
// que usa, el nombre de una persona y los pasos comunes.

import type { Settings } from '@ferrebress/shared/contracts/administration';
import { createGuards } from '../../platform/guards.ts';
import type { Platform } from '../../platform/modules.ts';
import type { Anomalies } from '../anomalies/index.ts';
import type { Catalog } from '../catalog/index.ts';
import { priceListsSettings } from './settings.ts';

export type PriceListsDependencies = {
  catalog: Catalog;
  anomalies: Anomalies;
  // Los ajustes de las listas (06 · R8), los de ahora.
  settings: () => Settings;
  // El nombre de una persona: quién subió y quién decidió cada lista (R6.7).
  nameOf: (userId: string) => Promise<string | null>;
};

export function createPriceListsContext(platform: Platform, dependencies: PriceListsDependencies) {
  return {
    platform,
    ...dependencies,
    ...createGuards(platform, { topic: 'price-lists', window: priceListsSettings.throttledAudit }),
  };
}

export type PriceListsContext = ReturnType<typeof createPriceListsContext>;

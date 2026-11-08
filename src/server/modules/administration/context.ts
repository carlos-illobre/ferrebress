// Lo que comparten las piezas de Administración en el servidor: la plataforma, las consultas, la
// memoria de los ajustes, quién recalcula los precios, el nombre de una persona y los pasos comunes.
import type { Kysely } from 'kysely';
import { createGuards } from '../../platform/guards.ts';
import type { Platform } from '../../platform/modules.ts';
import { type AdministrationTables, administrationData } from './data.ts';
import type { Memory } from './memory.ts';
import type { PriceRecalculator } from './recalculator.ts';
import { administrationSettings } from './settings.ts';

export type AdministrationDependencies = {
  nameOf: (userId: string) => Promise<string | null>;
  recalculator: PriceRecalculator;
};

export function createAdministrationContext(
  platform: Platform,
  memory: Memory,
  { nameOf, recalculator }: AdministrationDependencies,
) {
  return {
    platform,
    memory,
    nameOf,
    recalculator,
    data: administrationData(platform.db as Kysely<AdministrationTables>),
    ...createGuards(platform, {
      topic: 'administration',
      window: administrationSettings.throttledAudit,
    }),
  };
}

export type AdministrationContext = ReturnType<typeof createAdministrationContext>;

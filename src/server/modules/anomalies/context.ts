// Lo que comparten las piezas de las anomalías en el servidor: la plataforma, las consultas, cuántas
// hay abiertas, el nombre de una persona y los pasos comunes.
import type { Kysely } from 'kysely';
import { createGuards } from '../../platform/guards.ts';
import type { Platform } from '../../platform/modules.ts';
import { type AnomaliesTables, anomaliesData } from './data.ts';
import { anomaliesSettings } from './settings.ts';

export type AnomaliesDependencies = {
  nameOf: (userId: string) => Promise<string | null>;
};

// Cuántas hay abiertas, en la memoria del servidor (diseño de 08, § 6): se cuentan al arrancar y
// después de cada cambio, y la cabecera las lee sin consultar la base.
export function createOpenCount() {
  let count = 0;
  return {
    get: () => count,
    set: (value: number) => {
      count = value;
    },
  };
}
export type OpenCount = ReturnType<typeof createOpenCount>;

export function createAnomaliesContext(
  platform: Platform,
  open: OpenCount,
  { nameOf }: AnomaliesDependencies,
) {
  const data = anomaliesData(platform.db as Kysely<AnomaliesTables>);
  return {
    platform,
    data,
    nameOf,
    open,
    refresh: async () => open.set(await data.openCount()),
    ...createGuards(platform, { topic: 'anomalies', window: anomaliesSettings.throttledAudit }),
  };
}

export type AnomaliesContext = ReturnType<typeof createAnomaliesContext>;

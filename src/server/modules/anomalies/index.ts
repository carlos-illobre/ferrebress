// La fachada de las anomalías (06 · R9; diseño de 08, § 1): cada capítulo abre y cierra las suyas
// dentro de su transacción, sin conocer la tabla, y la cabecera lleva cuántas hay abiertas a quien
// tiene «Revisar las anomalías» (R9.5). No conoce a quien la usa: la recibe en server/modules.ts.
import {
  type AnomalyKind,
  type AnomalySummary,
  openAnomaliesField,
} from '@ferrebress/shared/contracts/anomalies';
import type { Kysely, Transaction } from 'kysely';
import type { Clock } from '../../platform/clock.ts';
import type { AfterCommit } from '../../platform/events.ts';
import { newId } from '../../platform/ids.ts';
import type { ServerModule } from '../../platform/modules.ts';
import { permissionsOf } from '../../platform/permissions.ts';
import { type AnomaliesDependencies, createAnomaliesContext, createOpenCount } from './context.ts';
import { type AnomaliesTables, anomaliesData } from './data.ts';
import { createAnomalies } from './migrations/001-anomalies.ts';
import { registerRoutes } from './routes.ts';

export type OpenAnomaly = { kind: AnomalyKind; subject: string; summary: AnomalySummary };

export type Anomalies = {
  // Abre una (o pone al día la que ya hay de esa cosa). Lo que devuelve se corre al confirmar.
  open(trx: Transaction<unknown>, anomaly: OpenAnomaly): Promise<AfterCommit>;
  // Cierra las de esa cosa que siguen sin cerrar (R9.4, E50); con `kind`, solo las de ese tipo.
  close(trx: Transaction<unknown>, subject: string, kind?: AnomalyKind): Promise<AfterCommit>;
};

export function createAnomaliesModule(dependencies: AnomaliesDependencies) {
  const count = createOpenCount();
  // El reloj del servidor: la fachada se usa recién con el servidor armado, ya registrada.
  let clock = undefined as unknown as Clock;
  // Lo que queda contado dentro de la transacción vale al confirmarla.
  const counted = async (data: ReturnType<typeof anomaliesData>): Promise<AfterCommit> => {
    const open = await data.openCount();
    return () => count.set(open);
  };
  const dataIn = (trx: Transaction<unknown>) => anomaliesData(trx as Kysely<AnomaliesTables>);

  const module: ServerModule = {
    name: 'anomalies',
    schema: { schema: 'anomalies', migrations: { '001-anomalies': createAnomalies } },
    async register(given) {
      clock = given.clock;
      const ctx = createAnomaliesContext(given, count, dependencies);
      await ctx.refresh();
      given.header.contribute(openAnomaliesField, (c) =>
        count.get() > 0 && permissionsOf(c).includes('anomalies.review')
          ? String(count.get())
          : undefined,
      );
      registerRoutes(ctx);
    },
  };

  const anomalies: Anomalies = {
    async open(trx, { kind, subject, summary }) {
      const data = dataIn(trx);
      await data.open(newId(clock), kind, subject, summary, clock.now());
      return counted(data);
    },
    async close(trx, subject, kind) {
      const data = dataIn(trx);
      await data.close(subject, clock.now(), kind);
      return counted(data);
    },
  };
  return { module, anomalies };
}

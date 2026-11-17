// La forma de lo que Anomalías pone en valores con nombre (ADR-019): lo que llega del otro dispositivo
// sin esa forma no entra.
import {
  type AnomaliesPage,
  anomalyKinds,
  anomalyStatuses,
} from '@ferrebress/shared/contracts/anomalies';
import * as z from 'zod/mini';

export const filterSchema = z.strictObject({
  status: z.enum(anomalyStatuses),
  kind: z.nullable(z.enum(anomalyKinds)),
});
export type Filter = z.infer<typeof filterSchema>;

export const pageSchema = z.custom<AnomaliesPage>(
  (value) => typeof value === 'object' && value !== null && 'anomalies' in value,
);
export const openedSchema = z.nullable(z.string().check(z.maxLength(40)));

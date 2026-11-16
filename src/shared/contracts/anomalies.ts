// Las anomalías (06 · R9; diseño de 08, § 2 y § 3): lo que piden y devuelven sus rutas. Las abre y
// las cierra cada capítulo por la fachada del servidor; acá está lo que ve la pantalla. Lo comparten
// el servidor, que valida, y la aplicación, que muestra.
import * as z from 'zod/mini';

// Cada capítulo suma las suyas (R9.1); las primeras son las de las listas de precios (08 · R9.2).
export const anomalyKinds = ['price-list-unreadable', 'price-list-skipped-rows'] as const;
export type AnomalyKind = (typeof anomalyKinds)[number];

export const anomalyStatuses = ['open', 'reviewed', 'closed'] as const;
export type AnomalyStatus = (typeof anomalyStatuses)[number];

// Lo que se muestra de cada una, sin precios (08 · R9.2): lo arma el capítulo que la abre.
export type AnomalySummary = Record<string, unknown>;

export type AnomalyView = {
  id: string;
  kind: AnomalyKind;
  // A qué se refiere, con el módulo adelante (`price-lists:list:<id>`): el enlace a lo que la causó.
  subject: string;
  status: AnomalyStatus;
  summary: AnomalySummary;
  openedAt: string;
  reviewedBy?: { id: string; name?: string };
  reviewedAt?: string;
  note?: string;
  closedAt?: string;
};

// De a 30, de la más nueva a la más vieja (R9.2); `next`, desde dónde sigue, si hay más.
export const anomaliesPageSize = 30;
export type AnomaliesPage = { anomalies: AnomalyView[]; next?: string };

const uuid = z
  .string()
  .check(z.regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/));

// Lo que se puede pedir de la lista: todo opcional; sin estado, las abiertas. Otro parámetro, error.
export const anomaliesQuery = z.strictObject({
  status: z.optional(z.enum(anomalyStatuses)),
  kind: z.optional(z.enum(anomalyKinds)),
  after: z.optional(uuid),
});
export type AnomaliesQuery = z.infer<typeof anomaliesQuery>;

export const anomalyNoteMax = 500;
export const reviewBody = z.strictObject({
  note: z.optional(z.string().check(z.maxLength(anomalyNoteMax))),
});
export type ReviewBody = z.infer<typeof reviewBody>;

// La letra de la cabecera con cuántas hay abiertas (R9.5), solo para quien tiene el permiso.
export const openAnomaliesField = 'a';

// La respuesta de marcar o volver a abrir: cómo quedó. Si otro la cambió antes, `409
// anomaly-changed` con cómo está ahora.
export type AnomalyChanged = { error: 'anomaly-changed'; anomaly: AnomalyView };

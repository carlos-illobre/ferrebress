// Lo que cada módulo tiene a medio hacer (una venta armándose, por ejemplo), para dos reglas que
// dependen de eso: la versión nueva no se aplica sola en segundo plano si hay algo a medio hacer
// (00 · R5.6), y si después de una sesión vencida entra otra persona, lo de la anterior se descarta
// (01 · E25, E26). Cada módulo anota lo suyo; el marco y la sesión solo preguntan.
export type Work = { pending: () => boolean; discard: () => void };

const works = new Set<Work>();

// Anota lo de un módulo; devuelve cómo dejar de anotarlo.
export function registerWork(work: Work): () => void {
  works.add(work);
  return () => works.delete(work);
}

export const halfDone = (): boolean => [...works].some((work) => work.pending());

export function discardWork(): void {
  for (const work of works) work.discard();
}

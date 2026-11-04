// La hora del servidor. Las reglas la reciben de acá, así las pruebas fijan la que quieran.
export type Clock = { now(): Date };

export const systemClock: Clock = { now: () => new Date() };

// Esperar de verdad, sin frenar el cierre del proceso; las pruebas pasan una espera que manejan ellas.
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms).unref());

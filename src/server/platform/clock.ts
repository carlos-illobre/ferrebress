// La hora del servidor. Las reglas la reciben de acá, así las pruebas fijan la que quieran.
export type Clock = { now(): Date };

export const systemClock: Clock = { now: () => new Date() };

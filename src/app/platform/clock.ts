// La hora del servidor en la aplicación (ADR-007): la última que dijo el servidor más lo que pasó
// desde entonces, medido con el cronómetro del navegador, que no cambia si alguien toca el reloj.
let anchor: { serverTime: number; at: number } | undefined;

export function syncServerTime(serverTime: number): void {
  anchor = { serverTime, at: performance.now() };
}

// undefined mientras el servidor no dijo su hora.
export function serverNow(): Date | undefined {
  return anchor && new Date(anchor.serverTime + performance.now() - anchor.at);
}

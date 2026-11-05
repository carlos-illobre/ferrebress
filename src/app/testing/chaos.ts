// La red de mentira según una semilla (diseño de 03, § 20): cuánto tarda cada cosa. Sin semilla, nada
// tarda: las pruebas de siempre no cambian. Con una, el Wi-Fi y el servidor de mentira demoran al azar,
// y dos pedidos al servidor pueden llegar en otro orden; el canal de datos y el tema mantienen su
// orden, como los de verdad.

// Números al azar que se repiten con la misma semilla (mulberry32).
export function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export const chaos = {
  // Cuántos milisegundos tarda lo próximo que viaja.
  delay: () => 0,
};

// Con una semilla: demoras de hasta `maxMs`. Devuelve cómo volver a la red sin demoras.
export function shake(seed: number, maxMs = 40): () => void {
  const next = random(seed);
  chaos.delay = () => Math.floor(next() * maxMs);
  return () => {
    chaos.delay = () => 0;
  };
}

// Algo que viaja en orden por el mismo camino: cada uno sale después del anterior.
export function inOrder() {
  let last = 0;
  return (run: () => void) => {
    last = Math.max(last, Date.now()) + chaos.delay();
    setTimeout(run, last - Date.now());
  };
}

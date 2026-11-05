// El medidor (diseño de 05, § 8.1; 03 · R4.5; 05 · R4.12): lo que el servidor manda por su cuenta por
// el canal, en KB por minuto sobre el último minuto. No es un acumulado: 60 casillas de un segundo,
// en memoria, para el total y para cada tema. No sabe de pantallas: el canal le dice de qué tema es
// cada cosa. No se guarda ni sale del dispositivo.
import { useEffect, useState } from 'preact/hooks';
import { watchReach } from './server/reach.ts';
import { platformSettings } from './settings.ts';

const total = '';

export function createMeter(now: () => number = () => Date.now()) {
  // De cada tema (y del total, ''): los bytes de cada casilla y de qué segundo es cada una.
  const series = new Map<string, { bytes: number[]; second: number[] }>();
  const seriesOf = (tag: string) => {
    let found = series.get(tag);
    if (!found) {
      const size = platformSettings.meter.windowSeconds;
      found = { bytes: new Array(size).fill(0), second: new Array(size).fill(-1) };
      series.set(tag, found);
    }
    return found;
  };
  const add = (tag: string, bytes: number, second: number) => {
    const one = seriesOf(tag);
    const slot = second % one.bytes.length;
    if (one.second[slot] !== second) {
      one.second[slot] = second;
      one.bytes[slot] = 0;
    }
    one.bytes[slot] = (one.bytes[slot] as number) + bytes;
  };
  return {
    // Cuenta lo que llegó: va al total una vez y a cada tema que se nombra.
    count(bytes: number, tags: readonly string[] = []): void {
      const second = Math.floor(now() / 1000);
      add(total, bytes, second);
      for (const tag of new Set(tags)) add(tag, bytes, second);
    },
    // Los bytes del último minuto: del total, o de un tema.
    rate(tag: string = total): number {
      const one = series.get(tag);
      if (!one) return 0;
      const newest = Math.floor(now() / 1000);
      const oldest = newest - one.bytes.length + 1;
      return one.bytes.reduce(
        (sum, bytes, slot) =>
          (one.second[slot] as number) >= oldest && (one.second[slot] as number) <= newest
            ? sum + bytes
            : sum,
        0,
      );
    },
  };
}

export type Meter = ReturnType<typeof createMeter>;

// El de la aplicación: uno solo por pestaña.
export const meter = createMeter();

// «0,2 KB/min»: los bytes del último minuto, con una decimal y la coma del castellano.
// Sin nada, «0 KB/min», como la maqueta.
export const kbPerMinute = (bytes: number): string =>
  bytes === 0
    ? '0 KB/min'
    : `${(bytes / 1024).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KB/min`;

// Los bytes del último minuto, leídos cada pocos segundos solo con la pestaña a la vista: el medidor
// no tiene temporizador propio.
export function useRate(tag?: string, source: Meter = meter): number {
  const [bytes, setBytes] = useState(() => source.rate(tag));
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const read = () => setBytes(source.rate(tag));
    const follow = () => {
      clearInterval(timer);
      timer = undefined;
      if (document.visibilityState !== 'visible') return;
      read();
      timer = setInterval(read, platformSettings.meter.redrawMs);
    };
    follow();
    const stop = watchReach(follow);
    return () => {
      stop();
      clearInterval(timer);
    };
  }, [tag, source]);
  return bytes;
}

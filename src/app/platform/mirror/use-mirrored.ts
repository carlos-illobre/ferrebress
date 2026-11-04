// Un valor con nombre para el estado de una pantalla, como `useState` (diseño de 03, § 5.1): se
// registra mientras la pantalla está montada y se espeja si hay otro dispositivo conectado. Sin
// espejo es un estado común con nombre. Cada valor lleva su esquema: lo que llega sin su forma no entra.
import { useEffect, useRef, useState } from 'preact/hooks';
import type * as z from 'zod/mini';
import { type Json, type MirroredValue, mirror } from './registry.ts';

export function useMirrored<T extends Json>(
  key: string,
  initial: T,
  schema: z.ZodMiniType<T>,
): [T, MirroredValue<T>['set']] {
  const registered = useRef<MirroredValue<T> | undefined>(undefined);
  registered.current ??= mirror.register(key, initial, schema);
  const value = registered.current;
  const [current, setCurrent] = useState(value.get());
  useEffect(() => {
    const stop = value.subscribe(setCurrent);
    return () => {
      stop();
      value.release();
      registered.current = undefined;
    };
  }, [value]);
  return [current, value.set];
}

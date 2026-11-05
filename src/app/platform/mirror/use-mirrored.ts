// Un valor con nombre para el estado de una pantalla, como `useState` (diseño de 03, § 5.1): se
// registra mientras la pantalla está montada y se espeja si hay otro dispositivo conectado. Sin
// espejo es un estado común con nombre. Cada valor lleva su esquema: lo que llega sin su forma no entra.
// Se registra al montarse, no al dibujarse: un dibujo que se descarta no deja la clave tomada. Lo que
// se pone antes (el efecto de una pieza de adentro, que corre primero) se aplica al registrarse.
import { useEffect, useRef, useState } from 'preact/hooks';
import type * as z from 'zod/mini';
import { type Json, type MirroredValue, mirror } from './registry.ts';

type Set<T extends Json> = MirroredValue<T>['set'];

export function useMirrored<T extends Json>(
  key: string,
  initial: T,
  schema: z.ZodMiniType<T>,
): [T, Set<T>] {
  const [current, setCurrent] = useState(initial);
  const registered = useRef<MirroredValue<T> | undefined>(undefined);
  const early = useRef<Parameters<Set<T>> | undefined>(undefined);
  useEffect(() => {
    const value = mirror.register(key, initial, schema);
    registered.current = value;
    if (early.current) value.set(...early.current);
    setCurrent(value.get());
    const stop = value.subscribe(setCurrent);
    return () => {
      stop();
      value.release();
      registered.current = undefined;
    };
  }, []);
  const set: Set<T> = (next, options) => {
    if (registered.current) return registered.current.set(next, options);
    early.current = [next, options];
    setCurrent(next);
  };
  return [current, set];
}

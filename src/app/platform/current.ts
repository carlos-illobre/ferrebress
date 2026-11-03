// Una función que se pasa a un efecto que vive más que un dibujo (un temporizador, un escuchador):
// el efecto llama siempre a la de ahora, no a la del dibujo en que empezó.
import { useRef } from 'preact/hooks';

export function useCurrent<A extends unknown[], R>(run: (...args: A) => R): (...args: A) => R {
  const ref = useRef(run);
  ref.current = run;
  return useRef((...args: A) => ref.current(...args)).current;
}

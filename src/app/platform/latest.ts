// Una pantalla que pide lo mismo varias veces seguidas (otra persona, otro filtro, otro día) se queda
// solo con la respuesta del último pedido: una anterior que llega tarde no pisa a la nueva.
import { useRef } from 'preact/hooks';

export function useLatest(): <T>(request: Promise<T>) => Promise<T | undefined> {
  const last = useRef(0);
  return async (request) => {
    const mine = ++last.current;
    const result = await request;
    return mine === last.current ? result : undefined;
  };
}

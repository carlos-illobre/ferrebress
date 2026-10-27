// Un valor que cambia y avisa a quien lo mira; las pantallas lo leen con useStore. Alcanza para lo
// poco que la aplicación comparte entre partes (la conexión, la versión, la sesión).
import { useEffect, useState } from 'preact/hooks';

export type Store<T> = {
  get(): T;
  set(value: T): void;
  subscribe(listener: (value: T) => void): () => void;
};

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();
  return {
    get: () => value,
    set(next) {
      if (Object.is(next, value)) return;
      value = next;
      for (const listener of listeners) listener(value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T>(store: Store<T>): T {
  const [value, setValue] = useState(store.get());
  useEffect(() => {
    setValue(store.get());
    return store.subscribe(setValue);
  }, [store]);
  return value;
}

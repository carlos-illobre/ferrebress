// Las pantallas abiertas y cuál está arriba (00 · R2.10, ADR-019 y ADR-020): cada modelo se anuncia
// con un nombre mientras su pantalla está abierta, y lo que se abre encima se anuncia después. Lo
// leen las capas que trabajan sobre los modelos (los atajos del teclado), sin que el modelo sepa
// de ellas. Sin ninguna capa, el registro existe igual y no molesta.
import { useLayoutEffect, useRef } from 'preact/hooks';
import { createStore } from './store.ts';

export type OpenScreen = { name: string; model: () => unknown };

const open = createStore<readonly OpenScreen[]>([]);

export const openScreens = open;
export const topScreen = (): OpenScreen | undefined => open.get().at(-1);

// Anuncia la pantalla mientras está abierta (`shown`: lo que se abre encima, como una confirmación,
// se anuncia solo mientras se ve). El modelo se lee al usarlo, así una capa siempre ve el de ahora y
// no el del momento en que se abrió.
export function useScreen(name: string, model: unknown, shown = true): void {
  const now = useRef(model);
  now.current = model;
  // Al dibujarse, no después: así una tecla apretada enseguida ya encuentra la pantalla.
  useLayoutEffect(() => {
    if (!shown) return;
    const entry: OpenScreen = { name, model: () => now.current };
    open.set([...open.get(), entry]);
    return () => open.set(open.get().filter((item) => item !== entry));
  }, [name, shown]);
}

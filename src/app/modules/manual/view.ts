// Lo que reciben las piezas de la pantalla del manual: lo que arma useManual, ya cargado, y cómo se
// ve (el celular angosto muestra el paso a paso y «Todos los pasos» como hojas).
import type { Chapter, ManualIndex, Task } from '@ferrebress/shared/contracts/manual';
import { useEffect, useState } from 'preact/hooks';
import type { Found } from './search.ts';
import type { Action, ManualState } from './state.ts';
import type { Failure } from './useManual.ts';

export type View = {
  index: ManualIndex;
  state: ManualState;
  act: (action: Action) => void;
  chapter: Chapter | Failure | undefined;
  task: Task | undefined;
  query: string;
  setQuery: (query: string) => void;
  searched: string;
  found: Found | undefined;
  searchFailed: boolean;
  testing: boolean;
  narrow: boolean;
};

const narrowQuery = '(max-width: 899px)';

// Si la pantalla es angosta (el corte de la maqueta, 900 px), al día con la ventana.
export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => matchMedia(narrowQuery).matches);
  useEffect(() => {
    const media = matchMedia(narrowQuery);
    const change = () => setNarrow(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return narrow;
}

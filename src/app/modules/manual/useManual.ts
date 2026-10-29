// La lógica de la pantalla del manual (diseño del manual, § 5), sin HTML: baja el índice (y, si la
// dirección nombra un capítulo, ese capítulo a la vez), lleva el estado con sus acciones, baja cada
// capítulo y el buscador del dispositivo cuando hacen falta, y escribe la dirección reemplazándola.
// Si el índice es de otra versión, o falta un archivo que el índice nombra, pide actualizar (R5.5).
import type {
  Chapter,
  Device,
  ManualIndex,
  SearchTask,
  Task,
} from '@ferrebress/shared/contracts/manual';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { navigate, route } from '../../platform/router.ts';
import { appVersion, updateRequired } from '../../platform/server/api.ts';
import { readAddress, validAddress, writeAddress } from './address.ts';
import { type Loaded, manualApi } from './api.ts';
import { searchManual } from './search.ts';
import { type Action, type ManualState, reduce, startState } from './state.ts';

export type Failure = 'offline' | 'missing';

// Un archivo que falta con red es una versión vieja: se pide actualizar.
function failure(loaded: Loaded<unknown> & { ok: false }): Failure {
  if (loaded.reason === 'missing') updateRequired.set(true);
  return loaded.reason;
}

const isName = (value: string | undefined): value is string =>
  value !== undefined && /^[a-z0-9-]+$/.test(value);

type Early = { id: string; loading: Promise<Loaded<Chapter>> } | undefined;

// El capítulo que nombra la dirección se pide junto con el índice; su nombre solo se acepta con la
// forma de un nombre, así no puede armar otra dirección (revisión de seguridad, 2).
function useIndex(device: Device) {
  const [index, setIndex] = useState<ManualIndex | Failure>();
  const [state, setState] = useState<ManualState>();
  const early = useRef<Early>(undefined);
  useEffect(() => {
    const address = readAddress(route.get().search);
    if (isName(address.chapter))
      early.current = {
        id: address.chapter,
        loading: manualApi.chapter({ id: address.chapter, name: '', icon: '' }),
      };
    void manualApi.index().then((loaded) => {
      if (!loaded.ok) return setIndex(failure(loaded));
      if (loaded.data.version !== appVersion) updateRequired.set(true);
      const chosen = address.device ?? device;
      const valid = validAddress(address, loaded.data, chosen);
      setIndex(loaded.data);
      setState({ ...startState(loaded.data, chosen), ...valid, sheet: valid.task !== undefined });
    });
  }, []);
  return { index, state, setState, early };
}

// `retry`: elegir otra tarea vuelve a pedir el capítulo que no llegó por falta de red.
function useChapter(
  index: ManualIndex | Failure | undefined,
  id: string | undefined,
  early: { current: Early },
  retry: string | undefined,
) {
  const [chapters, setChapters] = useState<Record<string, Chapter | Failure>>({});
  const entry =
    typeof index === 'object'
      ? index.chapters.find((one) => one.id === id && one.tasks)
      : undefined;
  useEffect(() => {
    if (!entry || (chapters[entry.id] !== undefined && chapters[entry.id] !== 'offline')) return;
    const loading =
      early.current?.id === entry.id ? early.current.loading : manualApi.chapter(entry);
    early.current = undefined;
    void loading.then((loaded) =>
      setChapters((now) => ({ ...now, [entry.id]: loaded.ok ? loaded.data : failure(loaded) })),
    );
  }, [entry, retry]);
  return entry ? chapters[entry.id] : undefined;
}

// Lo escrito en el buscador, lo buscado (150 ms después de dejar de escribir, R7.4) y lo encontrado.
function useSearch(index: ManualIndex | Failure | undefined, device: Device, testing: boolean) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [tasks, setTasks] = useState<Partial<Record<Device, SearchTask[] | Failure>>>({});
  useEffect(() => {
    const wait = setTimeout(() => setSearched(query), 150);
    return () => clearTimeout(wait);
  }, [query]);
  const ready = tasks[device];
  useEffect(() => {
    if (searched.trim().length < 2 || (ready && ready !== 'offline')) return;
    void manualApi
      .search(device)
      .then((loaded) =>
        setTasks((now) => ({ ...now, [device]: loaded.ok ? loaded.data : failure(loaded) })),
      );
  }, [searched, device]);
  const found = useMemo(
    () =>
      typeof index === 'object' && Array.isArray(ready)
        ? searchManual(searched, index, ready, testing)
        : undefined,
    [index, ready, searched, testing],
  );
  return { query, setQuery, searched, found, searchFailed: typeof ready === 'string' };
}

export function useManual(device: Device, testing: boolean) {
  const { index, state, setState, early } = useIndex(device);
  const chapter = useChapter(index, state?.chapter, early, state?.task);
  const search = useSearch(index, state?.device ?? device, testing);
  const act = (action: Action) =>
    // Solo se usa con el manual cargado: el índice y el estado ya están.
    setState((now) => reduce(now as ManualState, action, index as ManualIndex));
  useEffect(() => {
    if (!state) return;
    const { device: chosen, chapter: open, task, step } = state;
    navigate(writeAddress({ device: chosen, ...(open && task && { chapter: open, task, step }) }), {
      replace: true,
    });
  }, [state?.device, state?.chapter, state?.task, state?.step]);
  const task: Task | undefined =
    typeof chapter === 'object'
      ? chapter.tasks.find((one) => one.id === state?.task && one.device === state?.device)
      : undefined;
  return { index, state, act, chapter, task, ...search };
}

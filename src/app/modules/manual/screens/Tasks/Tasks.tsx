// «¿Qué querés hacer?» (maqueta final del manual): el buscador y, debajo, el índice en el orden de
// la lista (R6.4): cada capítulo escrito con sus tareas del dispositivo elegido y «Todos los pasos»;
// los que llevan a otro, con la tarea a la que llevan; y, en el ambiente de pruebas, los que faltan,
// con «Pronto». Con algo escrito, lo encontrado (R6.6). Las flechas recorren los renglones y Enter
// abre el marcado (00 · R2.4, R2.6).
import type { ChapterEntry } from '@ferrebress/shared/contracts/manual';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { isPhone } from '../../../../platform/device/device.ts';
import { maxQuery, minQuery } from '../../search.ts';
import { tasksOf } from '../../state.ts';
import { texts } from '../../texts.ts';
import type { View } from '../../view.ts';
import { Glyph } from '../Glyph/Glyph.tsx';
import { Results } from './Results.tsx';
import { detailOf, Group, Row, Soon } from './Rows.tsx';
import './Tasks.css';

type Folds = { isOpen: (id: string) => boolean; toggle: (id: string) => void };

// El título de un capítulo de la lista, que lo pliega (R6.9).
function ChapterGroup(props: { entry: ChapterEntry; folds: Folds; children: ComponentChildren }) {
  const { entry, folds } = props;
  return (
    <Group
      icon={entry.icon}
      name={entry.name}
      open={folds.isOpen(entry.id)}
      onToggle={() => folds.toggle(entry.id)}
    >
      {props.children}
    </Group>
  );
}

function Written({ view, entry, folds }: { view: View; entry: ChapterEntry; folds: Folds }) {
  const { state, act, narrow } = view;
  const tasks = tasksOf(view.index, entry.id, state.device);
  if (tasks.length === 0) return null;
  return (
    <ChapterGroup entry={entry} folds={folds}>
      <ul class="manual-task-list">
        {tasks.map((task) => (
          <Row
            key={task.id}
            icon={task.icon}
            name={task.title}
            detail={detailOf(task)}
            active={!narrow && state.chapter === entry.id && state.task === task.id}
            onOpen={() => act({ type: 'openTask', chapter: entry.id, task: task.id })}
          />
        ))}
        <Row
          icon="list-checks"
          name={texts.allSteps}
          detail={narrow ? texts.allStepsShort : texts.allStepsLong}
          className="all-steps"
          onOpen={() => act({ type: 'openAllSteps', chapter: entry.id })}
        />
      </ul>
    </ChapterGroup>
  );
}

// Un capítulo que lleva a la tarea de otro (R6.4): si no hay para este dispositivo, no sale.
function GoesTo({ view, entry, folds }: { view: View; entry: ChapterEntry; folds: Folds }) {
  const goesTo = entry.goesTo as NonNullable<ChapterEntry['goesTo']>;
  const id = goesTo.tasks[view.state.device];
  const task = tasksOf(view.index, goesTo.chapter, view.state.device).find((one) => one.id === id);
  if (!task) return null;
  return (
    <ChapterGroup entry={entry} folds={folds}>
      <ul class="manual-task-list">
        <Row
          icon={task.icon}
          name={task.title}
          detail={texts.steps(task.steps)}
          onOpen={() => view.act({ type: 'openTask', chapter: goesTo.chapter, task: task.id })}
        />
      </ul>
    </ChapterGroup>
  );
}

// Qué capítulos están abiertos: al empezar, el de la tarea que se lee (o el primero escrito), y se
// abre solo el de la tarea que se abre desde el buscador o la dirección. No se guarda (R6.8).
const soonId = 'soon';

function useFolds(view: View): Folds {
  const first = view.index.chapters.find((entry) => entry.tasks)?.id;
  const [open, setOpen] = useState(() => new Set([view.state.chapter ?? first]));
  // Solo cuando cambia la tarea que se lee: si no, volvería a abrir el que se acaba de plegar.
  const { chapter, task } = view.state;
  const reading = chapter && task ? `${chapter}/${task}` : undefined;
  const last = useRef(reading);
  useEffect(() => {
    if (!chapter || reading === last.current) return;
    last.current = reading;
    setOpen((now) => new Set(now).add(chapter));
  }, [reading]);
  return {
    isOpen: (id) => open.has(id),
    toggle: (id) =>
      setOpen((now) => {
        const next = new Set(now);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
  };
}

function Contents({ view, folds }: { view: View; folds: Folds }) {
  const missing = view.index.chapters.filter((chapter) => !chapter.tasks && !chapter.goesTo);
  return (
    <>
      {view.index.chapters.map((entry) =>
        entry.tasks ? (
          <Written key={entry.id} view={view} entry={entry} folds={folds} />
        ) : entry.goesTo ? (
          <GoesTo key={entry.id} view={view} entry={entry} folds={folds} />
        ) : null,
      )}
      {missing.length > 0 && (
        <Group
          name={texts.nextChapters}
          open={folds.isOpen(soonId)}
          onToggle={() => folds.toggle(soonId)}
          apart
        >
          <Soon chapters={missing} />
        </Group>
      )}
    </>
  );
}

export function Tasks({ view, top }: { view: View; top: ComponentChildren }) {
  const searching = view.searched.trim().length >= minQuery;
  // Aquí y no en la lista: buscar no se olvida de lo que se plegó.
  const folds = useFolds(view);
  const box = useRef<HTMLInputElement>(null);
  // En la computadora el cursor arranca en el buscador (00 · R2.2); en el celular, nunca (R2.12).
  useEffect(() => {
    if (!isPhone()) box.current?.focus();
  }, []);
  return (
    <section class="manual-tasks" aria-labelledby="manual-question">
      <div class="manual-ask">
        {top}
        <label class="manual-search">
          <Glyph name="search" />
          <input
            type="search"
            autocomplete="off"
            aria-label={texts.searchLabel}
            placeholder={view.narrow ? texts.searchShort : texts.searchLong}
            maxLength={maxQuery}
            value={view.query}
            onInput={(event) => view.setQuery(event.currentTarget.value)}
            data-slash=""
            data-clear=""
            ref={box}
          />
        </label>
      </div>
      <div class="manual-list" aria-live="polite">
        {searching ? <Results view={view} /> : <Contents view={view} folds={folds} />}
      </div>
    </section>
  );
}

// «¿Qué querés hacer?» (maqueta final del manual): el buscador y, debajo, el índice en el orden de
// la lista (R6.4): cada capítulo escrito con sus tareas del dispositivo elegido y «Todos los pasos»;
// los que llevan a otro, con la tarea a la que llevan; y, en el ambiente de pruebas, los que faltan,
// con «Pronto». Con algo escrito, lo encontrado (R6.6). Las flechas recorren los renglones y Enter
// abre el marcado (00 · R2.4, R2.6).
import type { ChapterEntry } from '@ferrebress/shared/contracts/manual';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { View } from '../../../../modules/manual/model.ts';
import {
  type Folds,
  maxQuery,
  minQuery,
  soonId,
  tasksOf,
  texts,
  useFolds,
} from '../../../../modules/manual/model.ts';
import { isPhone } from '../../../../platform/view/device.ts';
import { Search } from '../../ui/search/Search.tsx';
import { Glyph } from '../Glyph/Glyph.tsx';
import { Results } from './Results.tsx';
import { detailOf, Group, Row, Soon } from './Rows.tsx';
import './Tasks.css';

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
  // vista: el buscador, para llevar el cursor ahí.
  const box = useRef<HTMLInputElement>(null);
  // En la computadora el cursor arranca en el buscador (00 · R2.2); en el celular, nunca (R2.12).
  useEffect(() => {
    if (!isPhone()) box.current?.focus();
  }, []);
  return (
    <section class="manual-tasks" aria-labelledby="manual-question">
      <div class="manual-ask">
        {top}
        <Search
          look="manual-search"
          icon={<Glyph name="search" />}
          aria-label={texts.searchLabel}
          placeholder={{ long: texts.searchLong, short: texts.searchShort }}
          maxLength={maxQuery}
          value={view.query}
          onText={view.setQuery}
          data-slash=""
          data-clear=""
          ref={box}
        />
      </div>
      <div class="manual-list" aria-live="polite">
        {searching ? <Results view={view} /> : <Contents view={view} folds={folds} />}
      </div>
    </section>
  );
}

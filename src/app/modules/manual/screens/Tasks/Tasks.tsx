// «¿Qué querés hacer?» (maqueta final del manual): el buscador y, debajo, el índice en el orden de
// la lista (R6.4): cada capítulo escrito con sus tareas del dispositivo elegido y «Todos los pasos»;
// los que llevan a otro, con la tarea a la que llevan; y, en el ambiente de pruebas, los que faltan,
// con «Pronto». Con algo escrito, lo encontrado (R6.6). Las flechas recorren los renglones y Enter
// abre el marcado (00 · R2.4, R2.6).
import type { ChapterEntry } from '@ferrebress/shared/contracts/manual';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { isPhone } from '../../../../platform/device/device.ts';
import { tasksOf } from '../../state.ts';
import { texts } from '../../texts.ts';
import type { View } from '../../view.ts';
import { Glyph } from '../Glyph/Glyph.tsx';
import { Results } from './Results.tsx';
import { detailOf, Row, Soon } from './Rows.tsx';
import './Tasks.css';

function Written({ view, entry }: { view: View; entry: ChapterEntry }) {
  const { state, act, narrow } = view;
  const tasks = tasksOf(view.index, entry.id, state.device);
  if (tasks.length === 0) return null;
  return (
    <>
      <h2 class="manual-group">
        <Glyph name={entry.icon} size="small" />
        {entry.name}
      </h2>
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
    </>
  );
}

// Un capítulo que lleva a la tarea de otro (R6.4): si no hay para este dispositivo, no sale.
function GoesTo({ view, entry }: { view: View; entry: ChapterEntry }) {
  const goesTo = entry.goesTo as NonNullable<ChapterEntry['goesTo']>;
  const id = goesTo.tasks[view.state.device];
  const task = tasksOf(view.index, goesTo.chapter, view.state.device).find((one) => one.id === id);
  if (!task) return null;
  return (
    <>
      <h2 class="manual-group">
        <Glyph name={entry.icon} size="small" />
        {entry.name}
      </h2>
      <ul class="manual-task-list">
        <Row
          icon={task.icon}
          name={task.title}
          detail={texts.steps(task.steps)}
          onOpen={() => view.act({ type: 'openTask', chapter: goesTo.chapter, task: task.id })}
        />
      </ul>
    </>
  );
}

function Contents({ view }: { view: View }) {
  const missing = view.index.chapters.filter((chapter) => !chapter.tasks && !chapter.goesTo);
  return (
    <>
      {view.index.chapters.map((entry) =>
        entry.tasks ? (
          <Written key={entry.id} view={view} entry={entry} />
        ) : entry.goesTo ? (
          <GoesTo key={entry.id} view={view} entry={entry} />
        ) : null,
      )}
      {view.testing && missing.length > 0 && (
        <>
          <h2 class="manual-group apart">{texts.nextChapters}</h2>
          <Soon chapters={missing} />
        </>
      )}
    </>
  );
}

export function Tasks({ view, top }: { view: View; top: ComponentChildren }) {
  const searching = view.searched.trim().length >= 2;
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
            maxLength={60}
            value={view.query}
            onInput={(event) => view.setQuery(event.currentTarget.value)}
            data-slash=""
            data-clear=""
            ref={box}
          />
        </label>
      </div>
      <div class="manual-list" aria-live="polite">
        {searching ? <Results view={view} /> : <Contents view={view} />}
      </div>
    </section>
  );
}

// El paso a paso (maqueta final del manual): el título de la tarea con «Ver el clip» y «Todos los
// pasos», el escenario, el número y la frase del paso, el consejo y los botones para pasar. En el
// celular es una hoja que sube, que el botón atrás cierra; ahí el consejo va solo en el último paso.
// ← y → pasan de paso (data-arrows de la capa, diseño del manual, § 5).
import type { Task } from '@ferrebress/shared/contracts/manual';
import { useBackStep } from '../../../../platform/back-step.ts';
import { useCaptures } from '../../media.ts';
import { tasksOf } from '../../state.ts';
import { texts } from '../../texts.ts';
import type { View } from '../../view.ts';
import { Glyph } from '../Glyph/Glyph.tsx';
import { Stage } from '../Stage/Stage.tsx';
import './Guide.css';

function Head({ view, task }: { view: View; task: Task }) {
  const { act, narrow, index, state } = view;
  const chapter = index.chapters.find((one) => one.id === state.chapter)?.name;
  return (
    <div class="manual-guide-head">
      <span class="manual-pill pine desktop-only">{chapter}</span>
      <h2 class="manual-guide-title" id="manual-guide-title">
        {task.title}
      </h2>
      <div class="manual-guide-buttons">
        {task.clip && (
          <button
            type="button"
            class="button button-small"
            data-key="v"
            aria-label={texts.seeClip}
            onClick={() => act({ type: 'playClip' })}
          >
            <Glyph name="zap" size="small" />
            <span class="desktop-only">{texts.seeClip}</span>
            <kbd>V</kbd>
          </button>
        )}
        <button
          type="button"
          class="button button-small"
          data-key="t"
          onClick={() => act({ type: 'openAllSteps' })}
        >
          <Glyph name="list-checks" size="small" />
          <span>{texts.allSteps}</span>
          <kbd>T</kbd>
        </button>
        {narrow && (
          <button
            type="button"
            class="button button-plain manual-close"
            aria-label={texts.close}
            onClick={() => act({ type: 'closeSheet' })}
          >
            <Glyph name="x" size="large" />
          </button>
        )}
      </div>
    </div>
  );
}

function nextLabel(view: View, task: Task) {
  const tasks = tasksOf(view.index, view.state.chapter, view.state.device);
  const last = view.state.step === task.steps.length - 1;
  const next = tasks[tasks.findIndex((one) => one.id === task.id) + 1];
  if (!last) return texts.next;
  if (next) return view.narrow ? texts.nextTaskShort(next.title) : texts.nextTask(next.title);
  return view.narrow ? texts.doneShort : texts.done;
}

function Controls({ view, task }: { view: View; task: Task }) {
  const { act, state } = view;
  const first =
    tasksOf(view.index, state.chapter, state.device)[0]?.id === task.id && state.step === 0;
  return (
    <div class="manual-guide-controls">
      <button
        type="button"
        class="button button-large manual-previous"
        aria-label={texts.previous}
        data-key="a"
        data-arrow="previous"
        disabled={first}
        onClick={() => act({ type: 'previous' })}
      >
        <Glyph name="arrow-left" />
        <kbd>A</kbd>
      </button>
      <button
        type="button"
        class="button button-action button-large"
        data-key="s"
        data-arrow="next"
        onClick={() => act({ type: 'next' })}
      >
        <span>{nextLabel(view, task)}</span>
        <kbd>S</kbd>
      </button>
    </div>
  );
}

function Progress({ view, task }: { view: View; task: Task }) {
  return (
    <div class="manual-progress">
      {task.steps.map((_, at) => (
        <button
          type="button"
          // biome-ignore lint/suspicious/noArrayIndexKey: los pasos son fijos y su lugar es su identidad
          key={at}
          class={at <= view.state.step ? 'manual-progress-step done' : 'manual-progress-step'}
          aria-label={texts.stepLabel(at + 1)}
          aria-current={at === view.state.step ? 'step' : undefined}
          onClick={() => view.act({ type: 'goToStep', step: at })}
        />
      ))}
    </div>
  );
}

// En el celular, la hoja suma un paso al historial: atrás la cierra.
function SheetStep({ view }: { view: View }) {
  useBackStep(() => view.act({ type: 'closeSheet' }));
  return null;
}

export function Guide({ view, task }: { view: View; task: Task }) {
  const { state } = view;
  const captures = useCaptures(task, state.step);
  const step = task.steps[state.step];
  const last = state.step === task.steps.length - 1;
  const tip = task.tips[Math.min(state.step, task.tips.length - 1)];
  const open = !view.narrow || state.sheet;
  return (
    <main
      class={['manual-guide', last && 'last', open && 'open'].filter(Boolean).join(' ')}
      aria-labelledby="manual-guide-title"
      aria-hidden={!open || undefined}
    >
      {view.narrow && state.sheet && <SheetStep view={view} />}
      <Head view={view} task={task} />
      <Progress view={view} task={task} />
      <Stage
        task={task}
        step={state.step}
        direction={state.direction}
        clip={state.clip}
        captures={captures}
      />
      <span class="manual-number" aria-hidden="true">
        {state.step + 1}
      </span>
      <div class="manual-sentence">
        <p aria-live="polite">{step?.text}</p>
        <div class="manual-sentence-sub">
          {texts.stepOf(state.step + 1, task.steps.length)}
          {task.note && state.step === 0 && ` · ${task.note}`}
        </div>
      </div>
      {tip && (
        <div class="manual-tip">
          <Glyph name="info" size="small" />
          <span>{tip}</span>
        </div>
      )}
      <Controls view={view} task={task} />
    </main>
  );
}

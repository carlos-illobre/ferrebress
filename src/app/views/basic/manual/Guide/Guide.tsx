// El paso a paso (maqueta final del manual): el título de la tarea con «Ver el clip» y «Todos los
// pasos», el escenario, el número y la frase del paso, el consejo y los botones para pasar. En el
// celular es una hoja que sube, que el botón atrás cierra; ahí el consejo va solo en el último paso.
// ← y → pasan de paso (data-arrows de la capa, diseño del manual, § 5).
import type { Task } from '@ferrebress/shared/contracts/manual';
import type { View } from '../../../../modules/manual/model.ts';
import { taskAfter, tasksOf, texts, useCaptures } from '../../../../modules/manual/model.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import { Glyph } from '../Glyph/Glyph.tsx';
import { SheetStep } from '../SheetStep/SheetStep.tsx';
import { Stage } from '../Stage/Stage.tsx';
import './Guide.css';

function Head({ view, task }: { view: View; task: Task }) {
  const { act, narrow, index, state } = view;
  const hints = useShortcutHints('manual');
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
            aria-label={texts.seeClip}
            onClick={() => act({ type: 'playClip' })}
          >
            <Glyph name="zap" size="small" />
            <span class="desktop-only">{texts.seeClip}</span>
            {hints.clip && <kbd>{hints.clip}</kbd>}
          </button>
        )}
        <button
          type="button"
          class="button button-small"
          onClick={() => act({ type: 'openAllSteps' })}
        >
          <Glyph name="list-checks" size="small" />
          <span>{texts.allSteps}</span>
          {hints.allSteps && <kbd>{hints.allSteps}</kbd>}
        </button>
        {narrow && <CloseSheet view={view} />}
      </div>
    </div>
  );
}

function CloseSheet({ view }: { view: View }) {
  return (
    <button
      type="button"
      class="button button-plain manual-close"
      aria-label={texts.close}
      onClick={() => view.act({ type: 'closeSheet' })}
    >
      <Glyph name="x" size="large" />
    </button>
  );
}

function nextLabel(view: View, task: Task) {
  const last = view.state.step === task.steps.length - 1;
  const next = taskAfter(view.index, view.state.chapter, task.id, view.state.device)?.task;
  if (!last) return texts.next;
  if (next) return view.narrow ? texts.nextTaskShort(next.title) : texts.nextTask(next.title);
  return view.narrow ? texts.doneShort : texts.done;
}

function Controls({ view, task }: { view: View; task: Task }) {
  const { act, state } = view;
  const hints = useShortcutHints('manual');
  const first =
    tasksOf(view.index, state.chapter, state.device)[0]?.id === task.id && state.step === 0;
  return (
    <div class="manual-guide-controls">
      <button
        type="button"
        class="button button-large manual-previous"
        aria-label={texts.previous}
        data-arrow="previous"
        disabled={first}
        onClick={() => act({ type: 'previous' })}
      >
        <Glyph name="arrow-left" />
        {hints.previous && <kbd>{hints.previous}</kbd>}
      </button>
      <button
        type="button"
        class="button button-action button-large"
        data-arrow="next"
        onClick={() => act({ type: 'next' })}
      >
        <span>{nextLabel(view, task)}</span>
        {hints.next && <kbd>{hints.next}</kbd>}
      </button>
    </div>
  );
}

function Progress({ view, task }: { view: View; task: Task }) {
  const hints = useShortcutHints('manual');
  return (
    <div class="manual-progress">
      {task.steps.map((_, at) => (
        <button
          type="button"
          key={at}
          class={at <= view.state.step ? 'manual-progress-step done' : 'manual-progress-step'}
          aria-label={texts.stepLabel(at + 1)}
          aria-current={at === view.state.step ? 'step' : undefined}
          onClick={() => view.act({ type: 'goToStep', step: at })}
        >
          {hints[`step${at + 1}`] && <kbd>{hints[`step${at + 1}`]}</kbd>}
        </button>
      ))}
    </div>
  );
}

// En el celular, la hoja suma un paso al historial: atrás la cierra.
// El lugar del paso a paso cuando el capítulo no llegó por falta de red (R4.4): lo dice, y en el
// celular se cierra como la hoja de siempre. Se pide de nuevo solo al volver la conexión.
export function GuideOffline({ view }: { view: View }) {
  return (
    <main class="manual-guide open" aria-labelledby="manual-guide-offline">
      {view.narrow && <SheetStep close={() => view.act({ type: 'closeSheet' })} />}
      <div class="manual-guide-head">
        <h2 class="manual-guide-title" id="manual-guide-offline">
          {texts.offline}
        </h2>
        {view.narrow && <CloseSheet view={view} />}
      </div>
      <div class="manual-stage manual-stage-offline">{texts.offline}</div>
    </main>
  );
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
      {view.narrow && state.sheet && <SheetStep close={() => view.act({ type: 'closeSheet' })} />}
      <Head view={view} task={task} />
      <Progress view={view} task={task} />
      <Stage
        task={task}
        step={state.step}
        direction={state.direction}
        clip={state.clip ? Number(state.plays) : 0}
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

// «Todos los pasos» (00 · R6.5, maqueta final del manual): el capítulo entero del dispositivo
// elegido, para leerlo de corrido: la introducción y, por tarea, su título, su marca, su aclaración,
// los pasos numerados y todos sus consejos. Abierto desde una tarea, llega a ella y destella. En la
// computadora cubre el paso a paso (las tareas siguen a la vista) y se vuelve con Alt T o Esc; en el
// celular es otra hoja, que atrás o la × cierran.
import type { Chapter } from '@ferrebress/shared/contracts/manual';
import { useEffect, useRef } from 'preact/hooks';
import { useBackStep } from '../../../../platform/back-step.ts';
import { texts } from '../../texts.ts';
import type { View } from '../../view.ts';
import { Glyph } from '../Glyph/Glyph.tsx';
import './AllSteps.css';

function SheetStep({ close }: { close: () => void }) {
  useBackStep(close);
  return null;
}

function Parts({ chapter, view }: { chapter: Chapter; view: View }) {
  return (
    <>
      <p class="manual-all-intro">{chapter.intro[view.state.device]}</p>
      {chapter.tasks
        .filter((task) => task.device === view.state.device)
        .map((task) => (
          <article
            key={task.id}
            class={task.id === view.state.allFrom ? 'manual-all-part flash' : 'manual-all-part'}
            data-task={task.id}
            aria-labelledby={`manual-all-${task.id}`}
          >
            <div class="manual-all-part-head">
              <span class="manual-task-icon">
                <Glyph name={task.icon} />
              </span>
              <h3 id={`manual-all-${task.id}`}>{task.title}</h3>
              {task.tag && <span class="manual-pill action">{task.tag.long}</span>}
            </div>
            {task.note && <p class="manual-all-note">{task.note}</p>}
            <ol class="manual-all-steps">
              {task.steps.map((step) => (
                <li key={step.text}>{step.text}</li>
              ))}
            </ol>
            {task.tips.length > 0 && (
              <ul class="manual-all-tips">
                {task.tips.map((tip) => (
                  <li key={tip} class="manual-tip">
                    <Glyph name="info" size="small" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
    </>
  );
}

export function AllSteps({ view }: { view: View }) {
  const body = useRef<HTMLDivElement>(null);
  const close = () => view.act({ type: 'closeAllSteps' });
  const chapter = typeof view.chapter === 'object' ? view.chapter : undefined;
  useEffect(() => {
    const target = body.current?.querySelector<HTMLElement>(`[data-task="${view.state.allFrom}"]`);
    if (body.current && target) body.current.scrollTop = target.offsetTop - 8;
  }, [chapter]);
  return (
    <section class="manual-all" aria-labelledby="manual-all-title" data-layer="">
      {view.narrow && <SheetStep close={close} />}
      <div class="manual-all-head">
        <h2 id="manual-all-title">{texts.allStepsTitle(chapter?.name ?? '')}</h2>
        <button
          type="button"
          class="button button-small desktop-only"
          data-key="t"
          data-close=""
          onClick={close}
        >
          <Glyph name="arrow-left" size="small" />
          <span>{texts.backToGuide}</span>
          <kbd>T</kbd>
        </button>
        <button
          type="button"
          class="button button-plain manual-close phone-only"
          aria-label={texts.close}
          onClick={close}
        >
          <Glyph name="x" size="large" />
        </button>
      </div>
      <div class="manual-all-body" ref={body}>
        {chapter ? (
          <Parts chapter={chapter} view={view} />
        ) : (
          <p class="manual-all-intro">{texts.offline}</p>
        )}
      </div>
    </section>
  );
}

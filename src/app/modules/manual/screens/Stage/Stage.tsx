// El escenario del paso a paso (maqueta final del manual): la captura del paso con su aro y su rótulo;
// un paso sin captura muestra su ícono grande sobre la captura anterior, velada (o solo, si no hay);
// un paso del otro dispositivo lo aclara (R6.3); y el clip, cuando se lo pide. Lo que no llegó por
// falta de red se ve gris con «Sin conexión» (R4.4).
import type { Step, Task } from '@ferrebress/shared/contracts/manual';
import type { Captures } from '../../media.ts';
import { texts } from '../../texts.ts';
import { Glyph } from '../Glyph/Glyph.tsx';
import { Clip } from './Clip.tsx';
import { Shot } from './Shot.tsx';
import './Stage.css';

// La última captura antes de un paso: la que queda velada detrás de su ícono.
const lastCapture = (task: Task, step: number) =>
  task.steps.slice(0, step).findLast((one) => one.capture)?.capture;

function Veiled({ task, step, captures }: { task: Task; step: Step; captures: Captures }) {
  const behind = lastCapture(task, task.steps.indexOf(step));
  const url = behind && captures[behind.scene];
  return (
    <>
      {behind && url && url !== 'offline' && (
        <div class={`manual-capture ${behind.device}`}>
          <img src={url} alt="" width={behind.width} height={behind.height} />
        </div>
      )}
      <div class={behind ? 'manual-veil' : 'manual-veil alone'}>
        <span class="manual-veil-icon">
          <Glyph name={step.icon} size="huge" />
        </span>
      </div>
    </>
  );
}

export function Stage({
  task,
  step,
  direction,
  clip,
  captures,
}: {
  task: Task;
  step: number;
  direction: -1 | 0 | 1;
  clip: boolean;
  captures: Captures;
}) {
  const shown = task.steps[step] as Step;
  const layer = ['manual-layer', direction > 0 && 'from-right', direction < 0 && 'from-left'];
  return (
    <div class="manual-stage">
      <div class={layer.filter(Boolean).join(' ')} key={`${task.id}-${step}-${clip}`}>
        {clip && task.clip ? (
          <Clip name={task.clip} />
        ) : shown.capture ? (
          <Shot capture={shown.capture} url={captures[shown.capture.scene]} />
        ) : (
          <Veiled task={task} step={shown} captures={captures} />
        )}
        {!clip && shown.capture && shown.capture.device !== task.device && (
          <span class="manual-other">{texts.inOther[shown.capture.device]}</span>
        )}
      </div>
    </div>
  );
}

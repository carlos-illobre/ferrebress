// Una captura con lo que señala (00 · R6.5, maqueta final del manual): el aro sobre la captura, en el
// porcentaje que midió el programa de capturas, y el rótulo al costado y en diagonal, unido al aro
// por una línea (pedido de Carlos), todo en el azul del manual, para que no se confunda con la
// pantalla. El rótulo va afuera de la captura, en la
// capa, así puede salir de su marco y leerse entero. Una captura de la computadora más alta que el
// lugar se achica entera (recortada, el aro quedaría corrido). Las posiciones se ponen por CSSOM,
// nunca con style="…" en el HTML (diseño del manual, § 8).
import type { Capture } from '@ferrebress/shared/contracts/manual';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { texts } from '../../texts.ts';

const gap = 8;

// La captura de la computadora entra entera en el alto del escenario.
function fit(capture: HTMLElement, layer: HTMLElement, ratio: number): void {
  capture.style.removeProperty('width');
  const padding = (Number.parseFloat(getComputedStyle(layer).paddingTop) || 0) * 2;
  const room = layer.clientHeight - padding;
  if (capture.clientWidth * ratio > room)
    capture.style.setProperty('width', `${Math.floor(room / ratio)}px`);
}

type Marks = { ring: HTMLElement; label: HTMLElement; line: HTMLElement };

// La línea va del borde del aro a la esquina del rótulo que mira hacia él.
function link({ ring, label, line }: Marks, box: DOMRect): void {
  const dot = ring.getBoundingClientRect();
  const at = label.getBoundingClientRect();
  const x = dot.left + dot.width / 2 - box.left;
  const y = dot.top + dot.height / 2 - box.top;
  const toX = (label.classList.contains('to-left') ? at.right : at.left) - box.left;
  const toY = (label.classList.contains('to-up') ? at.bottom : at.top) - box.top;
  const radius = dot.width / 2;
  const length = Math.hypot(toX - x, toY - y);
  const angle = Math.atan2(toY - y, toX - x);
  line.style.setProperty('left', `${x + Math.cos(angle) * radius}px`);
  line.style.setProperty('top', `${y + Math.sin(angle) * radius}px`);
  line.style.setProperty('width', `${Math.max(0, length - radius)}px`);
  line.style.setProperty('transform', `rotate(${angle}rad)`);
}

// El rótulo junto al aro y, si igual no entra en el escenario, corrido hacia adentro.
function place(marks: Marks, layer: HTMLElement): void {
  const { ring, label } = marks;
  const box = layer.getBoundingClientRect();
  const dot = ring.getBoundingClientRect();
  label.style.setProperty('left', `${dot.left + dot.width / 2 - box.left}px`);
  label.style.setProperty('top', `${dot.top + dot.height / 2 - box.top}px`);
  label.style.setProperty('margin-left', '0px');
  const at = label.getBoundingClientRect();
  let shift = 0;
  if (at.right > box.right - gap) shift = box.right - gap - at.right;
  if (at.left + shift < box.left + gap) shift = box.left + gap - at.left;
  label.style.setProperty('margin-left', `${shift}px`);
  link(marks, box);
}

export function Shot({ capture, url }: { capture: Capture; url: string | undefined }) {
  const frame = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const [x, y] = capture.point;
  const side = `${x > 60 ? 'to-left' : 'to-right'} ${y > 75 ? 'to-up' : 'to-down'}`;
  useLayoutEffect(() => {
    const shot = frame.current as HTMLDivElement;
    const layer = shot.parentElement as HTMLElement;
    const arrange = () => {
      if (capture.device === 'computer') fit(shot, layer, capture.height / capture.width);
      const marks = { ring: ring.current, label: label.current, line: line.current };
      place(marks as Marks, layer);
    };
    (ring.current as HTMLElement).style.setProperty('left', `${x}%`);
    (ring.current as HTMLElement).style.setProperty('top', `${y}%`);
    arrange();
    addEventListener('resize', arrange);
    return () => removeEventListener('resize', arrange);
  }, [capture, url]);
  return (
    <>
      <div class={`manual-capture ${capture.device}`} ref={frame}>
        {url && url !== 'offline' ? (
          <img
            src={url}
            alt={texts.capture(capture.label)}
            width={capture.width}
            height={capture.height}
          />
        ) : (
          <span class="manual-capture-empty">{url === 'offline' ? texts.offline : ''}</span>
        )}
        <span class="manual-ring" ref={ring} />
      </div>
      <span class="manual-ring-line" ref={line} />
      <span class={`manual-ring-label ${side}`} ref={label}>
        {capture.label}
      </span>
    </>
  );
}

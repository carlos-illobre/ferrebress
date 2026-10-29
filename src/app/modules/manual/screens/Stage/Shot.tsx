// Una captura con lo que señala (00 · R6.5, maqueta final del manual): el aro sobre la captura, en el
// porcentaje que midió el programa de capturas, y el rótulo al costado y en diagonal, con una flecha
// hacia el aro, para que no se confunda con la pantalla. El rótulo va afuera de la captura, en la
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

// El rótulo junto al aro y, si igual no entra en el escenario, corrido hacia adentro.
function place(ring: HTMLElement, label: HTMLElement, layer: HTMLElement): void {
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
}

export function Shot({ capture, url }: { capture: Capture; url: string | undefined }) {
  const frame = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [x, y] = capture.point;
  const side = `${x > 60 ? 'to-left' : 'to-right'} ${y > 75 ? 'to-up' : 'to-down'}`;
  useLayoutEffect(() => {
    const shot = frame.current as HTMLDivElement;
    const layer = shot.parentElement as HTMLElement;
    const arrange = () => {
      if (capture.device === 'computer') fit(shot, layer, capture.height / capture.width);
      place(ring.current as HTMLElement, label.current as HTMLElement, layer);
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
      <span class={`manual-ring-label ${side}`} ref={label}>
        <svg class="manual-ring-arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 20 6 6M6 15V6h9" />
        </svg>
        {capture.label}
      </span>
    </>
  );
}

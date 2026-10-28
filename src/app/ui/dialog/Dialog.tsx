// El diálogo que frena todo (el bloqueo de la versión, «Algo salió mal»): un velo encima de la
// aplicación y la tarjeta al centro; en el celular, una hoja abajo. Mientras está abierto, lo de
// atrás queda inerte: ni el mouse ni Tab llegan (00 · R5.5). En la computadora el cursor arranca
// en el botón principal, así Enter lo toca; en el celular no (00 · R2.12). Tocar afuera no lo
// cierra: se sacude.
import type { ComponentChildren } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useRef } from 'preact/hooks';
import { isPhone } from '../../platform/device/device.ts';
import './dialog.css';

// La sacudida vuelve a empezar aunque ya estuviera sacudiéndose.
function shake(element: HTMLElement): void {
  element.classList.remove('shake');
  void element.offsetWidth;
  element.classList.add('shake');
}

export function Dialog({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ComponentChildren;
}) {
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    const app = document.getElementById('app') as HTMLElement;
    app.inert = true;
    if (!isPhone()) box.current?.querySelector<HTMLElement>('[data-primary]')?.focus();
    return () => {
      app.inert = false;
    };
  }, []);
  return createPortal(
    <>
      <div class="veil" onClick={() => shake(box.current as HTMLElement)} aria-hidden="true" />
      <section
        ref={box}
        class={`dialog ${className}`}
        role="alertdialog"
        aria-modal="true"
        aria-label={label}
        data-layer=""
      >
        {children}
      </section>
    </>,
    document.body,
  );
}

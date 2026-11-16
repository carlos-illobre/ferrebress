// La hoja que sube desde abajo, sobre un fondo oscurecido: una capa nueva para el teclado
// (00 · R2.10), así que mientras está abierta solo vale lo de adentro. Tocar afuera la cierra, igual
// que deslizarla hacia abajo o el botón que lleva closes. Trabada (`locked`, mientras espera algo que
// no se puede cortar, como la pregunta del navegador al instalar), no se cierra de esas formas.
import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import './sheet.css';

const swipeDownPx = 60;

export function Sheet({
  title,
  onClose,
  className,
  locked,
  children,
}: {
  title: string;
  onClose: () => void;
  className?: string;
  locked?: boolean;
  children: ComponentChildren;
}) {
  const start = useRef<number>(undefined);
  const extra = className ? ` ${className}` : '';
  const close = () => {
    if (!locked) onClose();
  };
  return (
    <>
      <div class={`sheet-scrim${extra}`} onClick={close} aria-hidden="true" />
      <section
        class={`sheet${extra}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-layer=""
        data-panel=""
        onPointerDown={(event) => {
          if (event.currentTarget.scrollTop <= 0) start.current = event.clientY;
        }}
        onPointerUp={(event) => {
          if (start.current !== undefined && event.clientY - start.current > swipeDownPx) close();
          start.current = undefined;
        }}
      >
        <div class="sheet-grabber" aria-hidden="true" />
        {children}
      </section>
    </>
  );
}

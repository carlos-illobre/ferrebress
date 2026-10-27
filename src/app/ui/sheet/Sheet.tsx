// La hoja que sube desde abajo, sobre un fondo oscurecido: una capa nueva para el teclado
// (00 · R2.10), así que mientras está abierta solo vale lo de adentro. Tocar afuera la cierra, igual
// que deslizarla hacia abajo o el botón que lleva closes.
import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import './sheet.css';

const swipeDownPx = 60;

export function Sheet({
  title,
  onClose,
  className,
  children,
}: {
  title: string;
  onClose: () => void;
  className?: string;
  children: ComponentChildren;
}) {
  const start = useRef<number>(undefined);
  const extra = className ? ` ${className}` : '';
  return (
    <>
      <div class={`sheet-scrim${extra}`} onClick={onClose} aria-hidden="true" />
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
          if (start.current !== undefined && event.clientY - start.current > swipeDownPx) onClose();
          start.current = undefined;
        }}
      >
        <div class="sheet-grabber" aria-hidden="true" />
        {children}
      </section>
    </>
  );
}

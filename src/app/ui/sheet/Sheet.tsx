// La hoja que sube desde abajo, sobre un fondo oscurecido: una capa nueva para el teclado
// (00 · R2.10), así que mientras está abierta solo vale lo de adentro. Tocar afuera la cierra, igual
// que el botón que lleva closes.
import type { ComponentChildren } from 'preact';
import './sheet.css';

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
}) {
  return (
    <>
      <div class="sheet-scrim" onClick={onClose} aria-hidden="true" />
      <section class="sheet" role="dialog" aria-modal="true" aria-label={title} data-layer="">
        <div class="sheet-grabber" aria-hidden="true" />
        {children}
      </section>
    </>
  );
}

// Cuántas cosas esperan en una opción (las anomalías abiertas, 06 · R9.5): un número en ámbar que se
// lee entero con el lector de pantalla. Sin nada, no hay número.
import { texts } from '../../../../modules/frame/model.ts';
import './Count.css';

export function Count({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span class="menu-count">
      <span aria-hidden="true">{count}</span>
      <span class="visually-hidden">{texts.waiting(count)}</span>
    </span>
  );
}

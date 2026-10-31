// Los renglones de la lista de tareas del manual: una tarea (con su ícono, su nombre y el detalle;
// sin flecha, que se confundía con la de plegar el capítulo, pedido de Carlos), los capítulos que
// faltan con «Pronto» y el texto con lo buscado resaltado como <mark>, armado con Preact y nunca
// como HTML (revisión de seguridad, 1).
import type { ChapterEntry, TaskSummary } from '@ferrebress/shared/contracts/manual';
import type { ComponentChildren } from 'preact';
import { marks } from '../../search.ts';
import { texts } from '../../texts.ts';
import { Glyph } from '../Glyph/Glyph.tsx';

export function Row({
  icon,
  name,
  detail,
  active,
  onOpen,
  className,
}: {
  icon: string;
  name: string;
  detail: ComponentChildren;
  active?: boolean;
  onOpen: () => void;
  className?: string;
}) {
  const classes = ['manual-task', active && 'active', className].filter(Boolean).join(' ');
  return (
    <li>
      <button
        type="button"
        class={classes}
        data-mark=""
        onClick={onOpen}
        aria-current={active || undefined}
      >
        <span class="manual-task-icon">
          <Glyph name={icon} />
        </span>
        <span>
          <span class="manual-task-name">{name}</span>
          <span class="manual-task-detail">{detail}</span>
        </span>
      </button>
    </li>
  );
}

// El título de un capítulo, que lo abre y lo cierra (pedido de Carlos: sin plegar, la lista abruma).
// Se abren varios a la vez; la flecha mira abajo con el capítulo abierto.
export function Group({
  icon,
  name,
  open,
  onToggle,
  apart,
  children,
}: {
  icon?: string;
  name: string;
  open: boolean;
  onToggle: () => void;
  apart?: boolean;
  children: ComponentChildren;
}) {
  return (
    <>
      <h2 class={apart ? 'manual-group apart' : 'manual-group'}>
        <button
          type="button"
          class="manual-fold"
          aria-expanded={open}
          data-mark=""
          onClick={onToggle}
        >
          {icon && <Glyph name={icon} size="small" />}
          <span>{name}</span>
          <Glyph name="chevron-right" size="small" />
        </button>
      </h2>
      {open && children}
    </>
  );
}

export const detailOf = (task: TaskSummary) => (
  <>
    {texts.steps(task.steps)}
    {task.clip && ` · ${texts.withClip}`}
    {task.tag && <span class="manual-pill action">{task.tag.short}</span>}
  </>
);

export function Soon({ chapters }: { chapters: ChapterEntry[] }) {
  return (
    <ul class="manual-coming">
      {chapters.map((chapter) => (
        <li key={chapter.id}>
          <Glyph name={chapter.icon} size="small" />
          {chapter.name}
          <span class="manual-pill">{texts.soon}</span>
        </li>
      ))}
    </ul>
  );
}

export const highlighted = (text: string, query: string) =>
  marks(text, query).map((piece, at) =>
    piece.marked ? <mark key={at}>{piece.text}</mark> : piece.text,
  );

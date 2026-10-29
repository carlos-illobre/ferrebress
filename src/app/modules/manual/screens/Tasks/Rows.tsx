// Los renglones de la lista de tareas del manual: una tarea (con su ícono, su nombre, el detalle y la
// flecha), los capítulos que faltan con «Pronto» y el texto con lo buscado resaltado como <mark>,
// armado con Preact y nunca como HTML (revisión de seguridad, 1).
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
        <Glyph name="chevron-right" />
      </button>
    </li>
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

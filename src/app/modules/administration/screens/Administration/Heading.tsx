// La cabecera de cada panel: su grupo, su nombre con su candado sin el permiso, qué cambia y, a la
// derecha, el número grande (cuántos precios, cuándo vence).
import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import type { Note } from '../../useAdministration.ts';

type HeadingProps = {
  group: string;
  icon: IconName;
  title: string;
  subtitle: string;
  locked: boolean;
  big?: { label: string; value: string; looking: boolean } | undefined;
};

export function Heading({ group, icon, title, subtitle, locked, big }: HeadingProps) {
  return (
    <>
      <p class="admin-group">{group}</p>
      <div class="admin-head">
        <div>
          <h2 class="admin-panel-title">
            <Icon name={icon} />
            {title}
            {locked && <Icon name="lock-keyhole" size="small" />}
          </h2>
          <p class="admin-subtitle">{subtitle}</p>
        </div>
        {big && (
          <div class="admin-big">
            <span>{big.label}</span>
            <b class={big.looking ? 'admin-big-looking' : ''}>{big.value}</b>
          </div>
        )}
      </div>
    </>
  );
}

// Lo que se dice en el lugar del ajuste: un valor que no vale, el cambio de otro o un error (R2.2,
// R2.3).
export function Said({ note, keys }: { note: Note | null; keys: readonly string[] }) {
  if (!note || !keys.includes(note.key)) return null;
  return (
    <p class={`admin-note admin-note-${note.kind}`} role="alert">
      <Icon name={note.kind === 'changed' ? 'users' : 'triangle-alert'} size="small" />
      {note.text}
    </p>
  );
}

export const Subhead = ({ children }: { children: ComponentChildren }) => (
  <h3 class="admin-subhead">{children}</h3>
);

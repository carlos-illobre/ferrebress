// El pie del menú de la computadora: la luz, que abre lo pendiente, y la tarjeta de la persona con
// «Salir» (01 · R5.1). Minimizado, la luz es un punto y la persona, sus iniciales, que abren la
// misma tarjeta al costado.
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { initials, useFrame } from '../../context.ts';
import { texts } from '../../texts.ts';
import { type Place, px } from '../../usePanels.ts';
import { LightText, Pending } from '../Pending/Pending.tsx';
import { CloseForKeyboard } from './More.tsx';

export function SideFooter() {
  const { panels } = useFrame();
  return (
    <div class="side-footer">
      <Light />
      <PersonMini />
      <PersonCard open={panels.open === 'person'} />
    </div>
  );
}

// Lo que se abre desde el pie dice su nombre en el rótulo cuando el menú está minimizado.
function useLabel() {
  const { tip } = useFrame();
  return {
    onPointerEnter: (event: PointerEvent) =>
      event.pointerType !== 'touch' && tip.label(event.currentTarget as HTMLElement),
    onPointerLeave: tip.hide,
  };
}

function Light() {
  const frame = useFrame();
  return (
    <button
      type="button"
      class="light"
      data-mark=""
      data-key="z"
      data-name={frame.online ? texts.light.online.long : texts.light.offline.long}
      aria-haspopup="dialog"
      onClick={(event) => frame.panels.toggle('pending', event.currentTarget)}
      {...useLabel()}
    >
      <LightText />
      <kbd>Z</kbd>
      <Icon name="chevron-right" size="small" />
    </button>
  );
}

function PersonMini() {
  const { person, panels } = useFrame();
  return (
    <button
      type="button"
      class="person-mini"
      data-mark=""
      data-key="s"
      data-name={person.name}
      data-detail={person.role}
      aria-haspopup="dialog"
      aria-expanded={panels.open === 'person'}
      aria-controls="person-card"
      aria-label={`${person.name}, ${person.role}`}
      onClick={(event) => panels.toggle('person', event.currentTarget)}
      {...useLabel()}
    >
      <span class="avatar">{initials(person.name)}</span>
      <kbd>S</kbd>
    </button>
  );
}

function PersonCard({ open }: { open: boolean }) {
  const { person, signOut } = useFrame();
  return (
    <section
      id="person-card"
      class={open ? 'person open side-panel' : 'person'}
      aria-label={texts.session}
      data-panel=""
      {...(open && { 'data-layer': '' })}
    >
      <div class="person-who">
        <span class="avatar">{initials(person.name)}</span>
        <div>
          <b>{person.name}</b>
          <small>{person.role}</small>
        </div>
      </div>
      <Button doing={texts.signingOut} onPress={signOut} size="small" icon="log-out" shortcut="s">
        {texts.signOut.long}
      </Button>
      {open && <CloseForKeyboard />}
    </section>
  );
}

export function PendingPanel() {
  const { panels } = useFrame();
  if (panels.open !== 'pending') return null;
  return (
    <section
      class="pending-panel"
      role="dialog"
      aria-label={texts.pending.title}
      data-layer=""
      data-panel=""
      style={{ left: px((panels.place as Place).left) }}
    >
      <Button
        doing={texts.close}
        onPress={panels.close}
        look="plain"
        size="small"
        icon="x"
        shortcut="c"
        closes
      >
        <span class="visually-hidden">{texts.close}</span>
      </Button>
      <Pending />
      <p class="pending-note">{texts.pending.note}</p>
    </section>
  );
}

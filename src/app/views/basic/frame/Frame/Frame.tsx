// El marco (capítulo 00, 01 · R6): el menú, la luz de conexión, la persona y, en el medio, la
// pantalla de la opción abierta, la de la dirección (o la primera que existe, R1.4). Una sola
// página para los dos anchos: desde 900 px es la computadora y debajo, el celular (ADR-002).
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { ComponentChildren, ComponentType } from 'preact';
import { useMemo } from 'preact/hooks';
import {
  type Option,
  texts,
  useLostPermission,
  useOpened,
  useWork,
} from '../../../../modules/frame/model.ts';
import { isNarrow } from '../../../../platform/view/narrow.ts';
import { notify } from '../../../../platform/view/notify.ts';
import { useCollapse } from '../behavior/useCollapse.ts';
import { usePanels } from '../behavior/usePanels.ts';
import { usePhoneMore } from '../behavior/usePhoneMore.ts';
import { useTip } from '../behavior/useTip.ts';
import { FrameContext, type FrameLink, type FrameState, shake } from '../context.ts';
import { NoPermission } from '../NoPermission/NoPermission.tsx';
import { PermissionLost } from '../NoPermission/PermissionLost.tsx';
import { VersionNotice, WaitNotice } from '../notices/Notices.tsx';
import { PhoneNav } from '../Phone/Phone.tsx';
import { PhoneMore } from '../Phone/PhoneMore.tsx';
import { PhoneSheets } from '../Phone/PhoneSheets.tsx';
import { Side } from '../Side/Side.tsx';
import { PendingPanel } from '../Side/SideFooter.tsx';
import { Tips } from './Tips.tsx';
import '../../styles/test-environment.css';
import './Frame.css';

export type FrameProps = {
  person: Person;
  testing: boolean;
  onSignOut: () => unknown;
  link?: FrameLink | undefined;
  // La pantalla de cada opción que ya existe, por su id: las pone cada módulo, por App.
  screens?: Partial<Record<string, ComponentType>> | undefined;
  children?: ComponentChildren;
};

// Lo que todavía no está, al tocarlo: se sacude y lo dice, en un globo o, angosto, en una tostada.
const notYetWith = (tip: FrameState['tip']) => (element: HTMLElement, name: string) => {
  shake(element);
  if (isNarrow()) notify(texts.notYetShort(name));
  else tip.notYet(element, name);
};

export function Frame(props: FrameProps) {
  const { person, testing, onSignOut, screens, children, link } = props;
  const { online, opened, current } = useOpened(person);
  const Screen = screens?.[current];
  const lost = useLostPermission(person, opened);
  const collapse = useCollapse();
  const panels = usePanels();
  const phoneMore = usePhoneMore();
  const tip = useTip((element) => labelled(element, collapse.collapsed));
  // La pantalla abierta no se vuelve a dibujar por lo que cambia solo en el marco: una etiqueta del
  // menú, un panel, el menú angosto. Con listas largas, eso se notaría al pasar el mouse.
  const work = useMemo(
    () => (
      <Work person={person} opened={opened} Screen={Screen}>
        {children}
      </Work>
    ),
    [person, opened, Screen, children],
  );
  const state: FrameState = {
    person,
    testing,
    online,
    current,
    collapse,
    panels,
    phoneMore,
    tip,
    notYet: notYetWith(tip),
    signOut: onSignOut,
    link,
  };
  return (
    <FrameContext.Provider value={state}>
      <div
        class={frameClass(collapse, phoneMore.open)}
        data-net={online ? 'online' : 'offline'}
        data-layer=""
      >
        <Side />
        {work}
        {lost.now && <PermissionLost lost={lost.now} first={lost.first} onGo={lost.go} />}
        <PhoneMore />
        <PhoneNav />
        <WaitNotice />
        <VersionNotice />
      </div>
      <PendingPanel />
      <PhoneSheets />
      {link && <link.Over />}
      <Tips />
      {testing && <TestEnvironment />}
    </FrameContext.Provider>
  );
}

// El área de trabajo: la pantalla de la opción abierta, o «Sin permiso» si no la puede usar (R7.7).
function Work({
  person,
  opened,
  Screen,
  children,
}: {
  person: Person;
  opened: Option | undefined;
  Screen: ComponentType | undefined;
  children?: ComponentChildren;
}) {
  const { blocked, first, goToFirst } = useWork(person, opened);
  return (
    <main class="work-area" aria-label={texts.workArea}>
      {blocked ? (
        <NoPermission option={blocked} first={first} go={goToFirst} />
      ) : Screen ? (
        <Screen />
      ) : (
        children
      )}
    </main>
  );
}

const frameClass = ({ collapsed, phase }: ReturnType<typeof useCollapse>, moreOpen: boolean) =>
  ['frame', collapsed && 'collapsed', phase, moreOpen && 'more-open'].filter(Boolean).join(' ');

// El rótulo con el nombre: el botón de minimizar siempre (es un ícono solo) y, con el menú
// minimizado, lo del menú que no está dentro de un panel abierto.
function labelled(element: HTMLElement, collapsed: boolean): boolean {
  if (element.classList.contains('collapse')) return true;
  return collapsed && element.closest('.side') !== null && !element.closest('.side-panel');
}

export function TestEnvironment() {
  return (
    <div class="test-frame" aria-hidden="true">
      <div class="test-border" />
      <div class="test-banner">
        {texts.testEnvironment}
        <span>{texts.testEnvironmentDetail}</span>
      </div>
    </div>
  );
}

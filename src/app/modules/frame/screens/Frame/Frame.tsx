// El marco (capítulo 00, 01 · R6): el menú, la luz de conexión, la persona y, en el medio, la
// pantalla de la opción abierta, la de la dirección (o la primera que existe, R1.4). Una sola
// página para los dos anchos: desde 900 px es la computadora y debajo, el celular (ADR-002).
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { ComponentChildren, ComponentType } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { isNarrow } from '../../../../platform/narrow.ts';
import { route } from '../../../../platform/router.ts';
import { online as onlineStore } from '../../../../platform/server/api.ts';
import { useStore } from '../../../../platform/store.ts';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { useCollapse } from '../../behavior/useCollapse.ts';
import { usePanels } from '../../behavior/usePanels.ts';
import { usePhoneMore } from '../../behavior/usePhoneMore.ts';
import { useTip } from '../../behavior/useTip.ts';
import { FrameContext, type FrameState, type SettingRow, shake } from '../../context.ts';
import { allowed, firstOption, goToFirst, insideAt, type Option, optionAt } from '../../menu.ts';
import { VersionNotice, WaitNotice } from '../../notices/Notices.tsx';
import { texts } from '../../texts.ts';
import { NoPermission } from '../NoPermission/NoPermission.tsx';
import { type LostPermission, PermissionLost } from '../NoPermission/PermissionLost.tsx';
import { PhoneNav } from '../Phone/Phone.tsx';
import { PhoneMore } from '../Phone/PhoneMore.tsx';
import { PhoneSheets } from '../Phone/PhoneSheets.tsx';
import { Side } from '../Side/Side.tsx';
import { PendingPanel } from '../Side/SideFooter.tsx';
import { Tips } from './Tips.tsx';
import '../../../../styles/test-environment.css';
import './Frame.css';

export type FrameProps = {
  person: Person;
  testing: boolean;
  onSignOut: () => unknown;
  setting?: SettingRow | undefined;
  // La pantalla de cada opción que ya existe, por su id: las pone cada módulo, por App.
  screens?: Partial<Record<string, ComponentType>> | undefined;
  children?: ComponentChildren;
};

export function Frame({ person, testing, onSignOut, setting, screens, children }: FrameProps) {
  const online = useStore(onlineStore);
  // La opción abierta es la de la dirección; en cualquier otra, la primera que puede usar (R1.4).
  const opened = optionAt(useStore(route).path);
  const current = opened?.id ?? firstOption(person).id;
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
    notYet(element, name) {
      shake(element);
      if (isNarrow()) showToast(texts.notYetShort(name));
      else tip.notYet(element, name);
    },
    signOut: onSignOut,
    setting,
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
        {lost.now && <PermissionLost lost={lost.now} first={firstOption(person)} onGo={lost.go} />}
        <PhoneMore />
        <PhoneNav />
        <WaitNotice />
        <VersionNotice />
      </div>
      <PendingPanel />
      <PhoneSheets />
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
  const guarded = useGuarded(person, opened);
  const blocked = guarded?.permission && !allowed(guarded, person) ? guarded.permission : undefined;
  return (
    <main class="work-area" aria-label={texts.workArea}>
      {guarded && blocked ? (
        <NoPermission
          option={{ ...guarded, permission: blocked }}
          first={firstOption(person)}
          go={() => goToFirst(person)}
        />
      ) : Screen ? (
        <Screen />
      ) : (
        children
      )}
    </main>
  );
}

// Lo que se mira: lo de adentro con su propio permiso, si la dirección es suya (05 · E13). Abierto por
// la dirección sin el permiso, «Sin permiso»; si se lo sacan con eso abierto, no: lo cierra la
// pantalla de la opción (02 · R7.8).
function useGuarded(person: Person, opened: Option | undefined) {
  const path = useStore(route).path;
  const inner = insideAt(opened, path);
  const had = useRef<string>(undefined);
  if (!inner) had.current = undefined;
  else if (allowed(inner, person)) had.current = path;
  return inner && had.current !== path ? inner : opened;
}

// R7.8: si con los permisos nuevos ya no puede usar la pantalla abierta, lo dice y la deja.
function useLostPermission(person: Person, opened: Option | undefined) {
  const before = useRef(person);
  const [now, setNow] = useState<LostPermission>();
  useEffect(() => {
    const was = before.current;
    before.current = person;
    // La que se veía: la de la dirección o, sin ninguna, la primera que podía usar (R1.4).
    const shown = opened ?? firstOption(was);
    if (was !== person && allowed(shown, was) && !allowed(shown, person))
      setNow({ option: shown, before: was, after: person });
  }, [person, opened]);
  const go = useCallback(() => {
    setNow(undefined);
    goToFirst(person);
  }, [person]);
  return { now, go };
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

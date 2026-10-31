// El marco (capítulo 00, 01 · R6): el menú, la luz de conexión, la persona y, en el medio, la
// pantalla de la opción abierta, la de la dirección (o la primera que existe, R1.4). Una sola
// página para los dos anchos: desde 900 px es la computadora y debajo, el celular (ADR-002).
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { ComponentChildren, ComponentType } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { route } from '../../../../platform/router.ts';
import { online as onlineStore } from '../../../../platform/server/api.ts';
import { useStore } from '../../../../platform/store.ts';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { useCollapse } from '../../behavior/useCollapse.ts';
import { usePanels } from '../../behavior/usePanels.ts';
import { usePhoneMore } from '../../behavior/usePhoneMore.ts';
import { useTip } from '../../behavior/useTip.ts';
import { FrameContext, type FrameState, type SettingRow, shake } from '../../context.ts';
import { allowed, firstOption, type Option, optionAt } from '../../menu.ts';
import { VersionNotice, WaitNotice } from '../../notices/Notices.tsx';
import { texts } from '../../texts.ts';
import { Lost, type LostPermission } from '../NoPermission/Lost.tsx';
import { goToFirst, NoPermission } from '../NoPermission/NoPermission.tsx';
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
      if (matchMedia('(max-width: 899px)').matches) showToast(texts.notYetShort(name));
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
        <main class="work-area" aria-label={texts.workArea}>
          {opened?.permission && !allowed(opened, person) ? (
            <NoPermission option={{ ...opened, permission: opened.permission }} />
          ) : Screen ? (
            <Screen />
          ) : (
            children
          )}
        </main>
        {lost.now && <Lost lost={lost.now} onGo={lost.go} />}
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

// R7.8: si con los permisos nuevos ya no puede usar la pantalla abierta, lo dice y la deja.
function useLostPermission(person: Person, opened: Option | undefined) {
  const before = useRef(person);
  const [now, setNow] = useState<LostPermission>();
  useEffect(() => {
    const was = before.current;
    before.current = person;
    if (opened && was !== person && allowed(opened, was) && !allowed(opened, person))
      setNow({ option: opened, before: was, after: person });
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

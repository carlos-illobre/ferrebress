// El marco (capítulo 00, 01 · R6): el menú, la luz de conexión, la persona y, en el medio, la
// pantalla de la opción abierta; mientras no exista ningún módulo, el área está en blanco. Una sola
// página para los dos anchos: desde 900 px es la computadora y debajo, el celular (ADR-002).
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { ComponentChildren, ComponentType } from 'preact';
import { route } from '../../../../platform/router.ts';
import { online as onlineStore } from '../../../../platform/server/api.ts';
import { useStore } from '../../../../platform/store.ts';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { useCollapse } from '../../behavior/useCollapse.ts';
import { usePanels } from '../../behavior/usePanels.ts';
import { usePhoneMore } from '../../behavior/usePhoneMore.ts';
import { useTip } from '../../behavior/useTip.ts';
import { FrameContext, type FrameState, type SettingRow, shake } from '../../context.ts';
import { exists, moreOptions, optionAt, parts } from '../../menu.ts';
import { VersionNotice, WaitNotice } from '../../notices/Notices.tsx';
import { texts } from '../../texts.ts';
import { PhoneNav, PhoneTop } from '../Phone/Phone.tsx';
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
  // La pantalla de cada opción que ya existe, por su id: las pone cada módulo, por App. Sabe si es el
  // ambiente de pruebas, donde lo que todavía no existe se ve con «Pronto» (R1.3).
  screens?: Partial<Record<string, ComponentType<{ testing: boolean }>>> | undefined;
  children?: ComponentChildren;
};

// La opción abierta (R1.4): la primera del menú que exista; en pruebas, sin ninguna, Vender.
const firstOption = (testing: boolean) =>
  [...parts, ...moreOptions].find((option) => exists(option) && !option.over)?.id ??
  (testing ? parts[0]?.id : undefined);

export function Frame({ person, testing, onSignOut, setting, screens, children }: FrameProps) {
  const online = useStore(onlineStore);
  // La opción abierta es la de la dirección; en cualquier otra, la primera (R1.4).
  const current = optionAt(useStore(route).path)?.id ?? firstOption(testing);
  const Screen = current ? screens?.[current] : undefined;
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
        <PhoneTop />
        <main class="work-area" aria-label={texts.workArea}>
          {Screen ? <Screen testing={testing} /> : children}
        </main>
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

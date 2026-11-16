// Más → Administración (capítulo 06; maqueta administration-settings/final, la variante 2 · Probar
// antes de elegir): los ajustes para todos, la lista para elegir uno y su panel, que muestra lo que
// haría cada opción antes de tocarla. Una sola pantalla para los dos anchos (ADR-002): en el celular,
// la lista se vuelve tiras arriba. Se baja recién al abrirla (AdministrationSlot).

import {
  texts,
  useAdministration,
  type Administration as View,
} from '../../../modules/administration/model.ts';
import { MoreCrumb, PhoneLight } from '../../../modules/frame/index.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { administrationShapes } from '../../../ui/icon/administration-shapes.tsx';
import { auditLogShapes } from '../../../ui/icon/audit-log-shapes.tsx';
import { addShapes, Icon } from '../../../ui/icon/Icon.tsx';
import { peopleShapes } from '../../../ui/icon/people-shapes.tsx';
import { LoadState } from '../../../ui/load-state/LoadState.tsx';
import { Say } from '../../../ui/say/Say.tsx';
import { Confirm } from './Confirm.tsx';
import { List } from './List.tsx';
import { MarginsPanel } from './Margins.tsx';
import { PairingPanel } from './Pairing.tsx';
import { RoundingPanel } from './Rounding.tsx';
import { SessionPanel } from './Session.tsx';
import { ZonePanel } from './Zone.tsx';
import './Administration.css';
import './Panel.css';
import './Parts.css';
import './Phone.css';

addShapes({
  ...administrationShapes,
  hourglass: peopleShapes.hourglass,
  'chevron-left': peopleShapes['chevron-left'],
  'lock-keyhole': peopleShapes['lock-keyhole'],
  'cloud-off': auditLogShapes['cloud-off'],
});

// Sin el permiso: qué falta y qué roles lo tienen (R1.2, E02).
function Permission({ roles }: { roles: string }) {
  return (
    <p class="admin-permission" role="status">
      <Icon name="lock-keyhole" size="small" />
      {texts.noPermission(roles)}
    </p>
  );
}

type Values = Parameters<typeof RoundingPanel>[0]['settings'];

function Panel({ view, values, clock }: { view: View; values: Values; clock: string }) {
  const props = { view, settings: values };
  if (view.panel === 'zone') return <ZonePanel view={view} clock={clock} />;
  if (view.panel === 'quickMargins') return <MarginsPanel {...props} />;
  if (view.panel === 'session') return <SessionPanel {...props} />;
  if (view.panel === 'pairingDays') return <PairingPanel {...props} />;
  return <RoundingPanel {...props} />;
}

function Retry({ view }: { view: View }) {
  const keys = useShortcutHints('administration');
  return (
    <button type="button" class="admin-retry" data-mark="" onClick={view.retry}>
      {texts.retry}
      {keys.retry && <kbd>{keys.retry}</kbd>}
    </button>
  );
}

function Body({ view }: { view: View }) {
  const clock = view.clock;
  const settings = view.data?.settings;
  if (!settings && view.failed && !view.online)
    return (
      <div class="admin-never" role="status">
        <Icon name="cloud-off" size="large" />
        <b>{texts.neverSeen}</b>
        <p class="admin-detail">{texts.neverSeenDetail}</p>
        <Retry view={view} />
      </div>
    );
  if (!settings)
    return <LoadState look="admin-loading" failed={view.failed} texts={texts} retry={view.retry} />;
  const values = {
    roundingStep: settings.roundingStep.value,
    quickMargins: settings.quickMargins.value,
    sessionIdle: settings.sessionIdle.value,
    sessionMax: settings.sessionMax.value,
    pairingDays: settings.pairingDays.value,
  };
  return (
    <div class={`admin-body ${view.fresh && view.online ? '' : 'admin-stale'}`}>
      {!(view.fresh && view.online) && (
        <p class="admin-offline" role="status">
          <Icon name="wifi-off" size="small" />
          <Say words={texts.offline(view.seenAtShown)} />
          <Retry view={view} />
        </p>
      )}
      <List view={view} settings={values} clock={clock} />
      <section class="admin-panel" role="tabpanel" data-panel={view.panel}>
        <Panel view={view} values={values} clock={clock} />
      </section>
    </div>
  );
}

export function Administration() {
  const view = useAdministration();
  return (
    <div class="admin">
      <header class="admin-header">
        <MoreCrumb name={texts.title} />
        <h1 class="admin-title">{texts.title}</h1>
        <PhoneLight />
        <span class="admin-for-all">
          <Icon name="users" size="small" />
          <Say words={texts.forAll} />
        </span>
        {!view.canChange && <Permission roles={view.holders} />}
      </header>
      <Body view={view} />
      {view.asked && <Confirm view={view} asked={view.asked} />}
    </div>
  );
}

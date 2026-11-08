// Los ajustes, para elegir cuál se mira (maqueta final): en la computadora, la lista a la izquierda,
// agrupada en precios, negocio y acceso, cada uno con su tecla; en el celular, las tiras de arriba.
import type { Settings } from '@ferrebress/shared/contracts/administration';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { shown } from '../../logic.ts';
import { names, type Panel, texts } from '../../texts.ts';
import type { Administration } from '../../useAdministration.ts';

type Item = {
  panel: Panel;
  icon: IconName;
  name: string;
  value: (s: Settings, clock: string) => string;
  key: string;
};

const items: Item[][] = [
  [
    {
      panel: 'roundingStep',
      icon: 'calculator',
      name: names.roundingStep,
      key: 'r',
      value: (s) => shown('roundingStep', s.roundingStep),
    },
    {
      panel: 'quickMargins',
      icon: 'percent',
      name: names.quickMargins,
      key: 'm',
      value: (s) => `${s.quickMargins[0]} a ${s.quickMargins[4]} %`,
    },
  ],
  [{ panel: 'zone', icon: 'globe', name: names.zone, key: 'z', value: (_, clock) => clock }],
  [
    {
      panel: 'session',
      icon: 'hourglass',
      name: names.sessionIdle,
      key: 's',
      value: (s) => shown('sessionIdle', s.sessionIdle),
    },
    {
      panel: 'session',
      icon: 'timer',
      name: names.sessionMax,
      key: 't',
      value: (s) => shown('sessionMax', s.sessionMax),
    },
    {
      panel: 'pairingDays',
      icon: 'link',
      name: names.pairingDays,
      key: 'v',
      value: (s) => shown('pairingDays', s.pairingDays),
    },
  ],
];
const groups = ['Precios', 'Negocio', 'Acceso'];

// Con la tecla del ajuste se llega también a sus opciones: el cursor va a la elegida (o a la caja),
// y desde ahí ← → las recorren (R1.8). Después de dibujar el panel nuevo.
const focusChosen = (panel: Panel) => {
  const target = () =>
    document.querySelector<HTMLElement>(
      `[data-panel="${panel}"] [aria-pressed="true"], [data-panel="${panel}"] input`,
    );
  const tryFocus = (left: number) => {
    const found = target();
    if (found) found.focus();
    else if (left > 0) setTimeout(() => tryFocus(left - 1), 16);
  };
  tryFocus(10);
};

export function List({
  view,
  settings,
  clock,
}: {
  view: Administration;
  settings: Settings;
  clock: string;
}) {
  return (
    <div class="admin-list" role="tablist" aria-label="Ajustes" aria-orientation="vertical">
      {items.map((group, g) => (
        <div key={groups[g]} class="admin-list-group">
          <h2>{groups[g]}</h2>
          {group.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              class="admin-item"
              aria-selected={view.panel === item.panel}
              data-key={item.key}
              data-mark=""
              onClick={() => {
                view.setPanel(item.panel);
                focusChosen(item.panel);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.name}</span>
              <b>{item.value(settings, clock)}</b>
              <kbd>{item.key.toUpperCase()}</kbd>
            </button>
          ))}
        </div>
      ))}
      {view.editable && (
        <p class="admin-hint desktop-only">
          <Icon name="mouse-pointer-2" size="small" />
          {texts.hint}
        </p>
      )}
    </div>
  );
}

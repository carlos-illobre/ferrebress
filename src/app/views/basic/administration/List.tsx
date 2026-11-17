// Los ajustes, para elegir cuál se mira (maqueta final): en la computadora, la lista a la izquierda,
// agrupada en precios, negocio y acceso, cada uno con su tecla; en el celular, las tiras de arriba.
import type { Settings } from '@ferrebress/shared/contracts/administration';
import { useEffect } from 'preact/hooks';
import type { Administration, AdminPage } from '../../../modules/administration/model.ts';
import {
  names,
  openAdminPage,
  type Panel,
  pagesTexts,
  shown,
  texts,
  useAdminLinks,
} from '../../../modules/administration/model.ts';
import { useMenuCount } from '../../../modules/frame/model.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { Count } from '../frame/index.ts';
import { Icon, type IconName } from '../ui/icon/Icon.tsx';

type AdminLink = Exclude<AdminPage, 'settings'>;

// command: el atajo que lo elige (modules/administration/shortcuts/administration.ts).
type Item = {
  panel: Panel;
  icon: IconName;
  name: string;
  value: (s: Settings, clock: string) => string;
  command: string;
};

const items: Item[][] = [
  [
    {
      panel: 'roundingStep',
      icon: 'calculator',
      name: names.roundingStep,
      command: 'roundingStep',
      value: (s) => shown('roundingStep', s.roundingStep),
    },
    {
      panel: 'quickMargins',
      icon: 'percent',
      name: names.quickMargins,
      command: 'quickMargins',
      value: (s) => `${s.quickMargins[0]} a ${s.quickMargins[4]} %`,
    },
  ],
  [
    {
      panel: 'lists',
      icon: 'file-text',
      name: names.reviewPercent,
      command: 'lists',
      value: (s) => shown('reviewPercent', s.reviewPercent),
    },
    {
      panel: 'lists',
      icon: 'file-up',
      name: names.maxFileMb,
      command: 'lists-upload',
      value: (s) => shown('maxFileMb', s.maxFileMb),
    },
    {
      panel: 'lists',
      icon: 'archive',
      name: names.filesMb,
      command: 'lists-files',
      value: (s) => shown('filesMb', s.filesMb),
    },
  ],
  [{ panel: 'zone', icon: 'globe', name: names.zone, command: 'zone', value: (_, clock) => clock }],
  [
    {
      panel: 'session',
      icon: 'hourglass',
      name: names.sessionIdle,
      command: 'sessionIdle',
      value: (s) => shown('sessionIdle', s.sessionIdle),
    },
    {
      panel: 'session',
      icon: 'timer',
      name: names.sessionMax,
      command: 'sessionMax',
      value: (s) => shown('sessionMax', s.sessionMax),
    },
    {
      panel: 'pairingDays',
      icon: 'link',
      name: names.pairingDays,
      command: 'pairingDays',
      value: (s) => shown('pairingDays', s.pairingDays),
    },
  ],
];
const pageIcons: Record<AdminLink, IconName> = {
  anomalies: 'triangle-alert',
  readers: 'workflow',
  files: 'file-text',
};

const groups = ['Precios', 'Listas de precios', 'Negocio', 'Acceso'];

// Con la tecla del ajuste se llega también a sus opciones: el cursor va a la elegida (o a la caja),
// y desde ahí ← → las recorren (R1.8). Corre después de dibujar el panel nuevo.
const focusChosen = (panel: Panel) =>
  document
    .querySelector<HTMLElement>(
      `[data-panel="${panel}"] [aria-pressed="true"], [data-panel="${panel}"] input`,
    )
    ?.focus();

export function List({
  view,
  settings,
  clock,
}: {
  view: Administration;
  settings: Settings;
  clock: string;
}) {
  const keys = useShortcutHints('administration');
  const links = useAdminLinks();
  const anomalies = useMenuCount('anomalies');
  // Cada vez que se elige un ajuste (con el mouse, el dedo o su atajo), el cursor va a sus opciones.
  useEffect(() => {
    if (view.chosen > 0) focusChosen(view.panel);
  }, [view.chosen]);
  return (
    <div class="admin-list">
      <div class="admin-tabs" role="tablist" aria-label="Ajustes" aria-orientation="vertical">
        {items.map((group, g) => (
          <div key={groups[g]} class="admin-list-group">
            <h2>{groups[g]}</h2>
            {group.map((item) => (
              <button
                key={item.command}
                type="button"
                role="tab"
                class="admin-item"
                aria-selected={view.panel === item.panel}
                data-mark=""
                onClick={() => view.choose(item.panel)}
              >
                <Icon name={item.icon} />
                <span>{item.name}</span>
                <b>{item.value(settings, clock)}</b>
                {keys[item.command] && <kbd>{keys[item.command]}</kbd>}
              </button>
            ))}
          </div>
        ))}
      </div>
      <nav class="admin-list-group admin-pages" aria-label={pagesTexts.title}>
        <h2>{pagesTexts.title}</h2>
        {links.map((page) => (
          <button
            key={page}
            type="button"
            class="admin-item admin-page"
            data-mark=""
            onClick={() => openAdminPage(page)}
          >
            <Icon name={pageIcons[page]} />
            <span>
              {pagesTexts[page].name}
              <small>{pagesTexts[page].detail}</small>
            </span>
            {page === 'anomalies' && <Count count={anomalies} />}
            <Icon name="chevron-right" size="small" />
          </button>
        ))}
      </nav>
      {view.editable && (
        <p class="admin-hint desktop-only">
          <Icon name="mouse-pointer-2" size="small" />
          {texts.hint}
        </p>
      )}
    </div>
  );
}

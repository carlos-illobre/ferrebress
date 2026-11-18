// Los ajustes, para elegir cuál se mira (maqueta final): en la computadora, la lista a la izquierda,
// agrupada en precios, negocio y acceso, cada uno con su tecla; en el celular, las tiras de arriba.
import { useEffect } from 'preact/hooks';
import type { Administration, AdminPage } from '../../../modules/administration/model.ts';
import {
  openAdminPage,
  type Panel,
  pagesTexts,
  texts,
} from '../../../modules/administration/model.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { Count } from '../frame/index.ts';
import { Icon, type IconName } from '../ui/icon/Icon.tsx';

type AdminLink = Exclude<AdminPage, 'settings'>;

// El ícono de cada ajuste (por su atajo) y de cada página: la forma es de la vista.
const settingIcons: Record<string, IconName> = {
  roundingStep: 'calculator',
  quickMargins: 'percent',
  lists: 'file-text',
  'lists-upload': 'file-up',
  'lists-files': 'archive',
  zone: 'globe',
  sessionIdle: 'hourglass',
  sessionMax: 'timer',
  pairingDays: 'link',
};
const pageIcons: Record<AdminLink, IconName> = {
  anomalies: 'triangle-alert',
  readers: 'workflow',
  files: 'file-text',
};

// Con la tecla del ajuste se llega también a sus opciones: el cursor va a la elegida (o a la caja),
// y desde ahí ← → las recorren (R1.8). Corre después de dibujar el panel nuevo.
const focusChosen = (panel: Panel) =>
  document
    .querySelector<HTMLElement>(
      `[data-panel="${panel}"] [aria-pressed="true"], [data-panel="${panel}"] input`,
    )
    ?.focus();

export function List({ view }: { view: Administration }) {
  const keys = useShortcutHints('administration');
  // Cada vez que se elige un ajuste (con el mouse, el dedo o su atajo), el cursor va a sus opciones.
  useEffect(() => {
    if (view.chosen > 0) focusChosen(view.panel);
  }, [view.chosen]);
  return (
    <div class="admin-list">
      <div class="admin-tabs" role="tablist" aria-label="Ajustes" aria-orientation="vertical">
        {view.groups.map((group) => (
          <div key={group.title} class="admin-list-group">
            <h2>{group.title}</h2>
            {group.rows.map((item) => (
              <button
                key={item.command}
                type="button"
                role="tab"
                class="admin-item"
                aria-selected={view.panel === item.panel}
                data-mark=""
                onClick={() => view.choose(item.panel)}
              >
                <Icon name={settingIcons[item.command] as IconName} />
                <span>{item.name}</span>
                <b>{item.value}</b>
                {keys[item.command] && <kbd>{keys[item.command]}</kbd>}
              </button>
            ))}
          </div>
        ))}
      </div>
      <nav class="admin-list-group admin-pages" aria-label={pagesTexts.title}>
        <h2>{pagesTexts.title}</h2>
        {view.links.map((link) => (
          <button
            key={link.page}
            type="button"
            class="admin-item admin-page"
            data-mark=""
            onClick={() => openAdminPage(link.page)}
          >
            <Icon name={pageIcons[link.page]} />
            <span>
              {link.name}
              <small>{link.detail}</small>
            </span>
            {link.count !== undefined && <Count count={link.count} />}
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

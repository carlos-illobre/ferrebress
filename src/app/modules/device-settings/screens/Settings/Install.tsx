// Instalar en este dispositivo (R4.1 a R4.3) y, en el celular, trabajar sin conexión (R5): el botón,
// «Ya está instalada» o los pasos del iPhone; la llave, o apagada con por qué no se puede.
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { texts } from '../../texts.ts';
import { installHere, type SettingsView } from '../../useSettings.ts';

const t = texts.install;

function InstallText({ row }: { row: NonNullable<SettingsView['install']> }) {
  if (row === 'installed')
    return (
      <span class="settings-text">
        <b>{t.installedName}</b>
        <small>{t.installedWhat}</small>
      </span>
    );
  return (
    <span class="settings-text">
      <b>
        <Say words={t.name} />
      </b>
      <small>{row === 'ios' ? t.ios : <Say words={t.what} />}</small>
    </span>
  );
}

export function InstallRow({ view }: { view: SettingsView }) {
  if (!view.install) return null;
  return (
    <div class="settings-setting" id="settings-install">
      <div class="settings-row">
        <span class="settings-icon">
          <Icon name="app-window" />
        </span>
        <InstallText row={view.install} />
        {view.install === 'button' && (
          <Button look="action" icon="download" shortcut="i" doing={t.button} onPress={installHere}>
            {t.button}
          </Button>
        )}
      </div>
    </div>
  );
}

export function OfflineRow({ view }: { view: SettingsView }) {
  const row = view.offline;
  if (!row) return null;
  return (
    <div class="settings-setting" id="settings-offline">
      <button
        type="button"
        class="settings-row"
        role="switch"
        aria-checked={row.on}
        aria-labelledby="settings-offline-name"
        aria-describedby="settings-offline-detail"
        disabled={!!row.blocked}
        onClick={row.toggle}
      >
        <span class="settings-icon">
          <Icon name="wifi-off" />
        </span>
        <span class="settings-text">
          <b id="settings-offline-name">{row.name}</b>
          <small id="settings-offline-detail">
            {row.blocked ?? (row.on ? texts.offlineOn : row.detail)}
          </small>
        </span>
        <span class="switch" aria-hidden="true" />
      </button>
    </div>
  );
}

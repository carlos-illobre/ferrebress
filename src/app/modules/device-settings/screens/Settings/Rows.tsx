// Las animaciones (R2) y el formato de la hora (R3), con su muestra: la ventanita que se mueve o
// aparece de golpe, y la hora de ahora escrita con cada formato.
import type { TimeFormat } from '../../../../platform/time.ts';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { moves } from '../../rules.ts';
import { texts } from '../../texts.ts';
import type { SettingsView } from '../../useSettings.ts';
import { nowIn, nowText } from './Summary.tsx';
import './Rows.css';

const a = texts.animations;

export function AnimationsRow({ view }: { view: SettingsView }) {
  const on = view.chosen.animations;
  return (
    <div class="settings-setting" id="settings-animations">
      <button
        type="button"
        class="settings-row"
        role="switch"
        aria-checked={on}
        aria-labelledby="settings-animations-name"
        data-key="d"
        data-mark=""
        onClick={() => view.set({ animations: !on })}
      >
        <span class="settings-icon">
          <Icon name="sparkles" />
        </span>
        <span class="settings-text">
          <b id="settings-animations-name">{a.name}</b>
          <small>
            <Say words={a.what} />
          </small>
        </span>
        <kbd>D</kbd>
        <span class="switch" aria-hidden="true" />
      </button>
      <div
        class={moves(view.chosen, view.systemStill) ? 'settings-sample moving' : 'settings-sample'}
      >
        <span class="settings-scene" aria-hidden="true">
          <span class="settings-window" />
        </span>
        <span>
          <Say words={moves(view.chosen, view.systemStill) ? a.moving : a.still} />
        </span>
        <span class="settings-waits desktop-only">
          <span class="settings-spinner keeps-moving" aria-hidden="true" />
          {a.waits}
        </span>
      </div>
      {view.systemStill && (
        <p class="settings-system" role="note">
          <Say words={a.system} />
        </p>
      )}
    </div>
  );
}

const t = texts.time;
const formats: TimeFormat[] = ['h24', 'h12'];

export function TimeRow({ view }: { view: SettingsView }) {
  const chosen = view.chosen.timeFormat;
  const now = nowText();
  return (
    <div class="settings-setting" id="settings-time">
      <div class="settings-row">
        <span class="settings-icon">
          <Icon name="clock" />
        </span>
        <span class="settings-text">
          <b id="settings-time-name">{t.name}</b>
          <small>
            <Say words={t.what} />
          </small>
        </span>
      </div>
      <div class="settings-formats">
        {formats.map((format) => (
          <button
            key={format}
            type="button"
            class="settings-format"
            aria-pressed={format === chosen}
            // Alt H pasa al otro formato (R1.9).
            data-key={format === chosen ? undefined : 'h'}
            data-mark=""
            onClick={() => view.set({ timeFormat: format })}
          >
            <span class="settings-format-time">{nowIn(format)}</span>
            <b>{t[format].name}</b>
            <small class="desktop-only">{t[format].detail}</small>
            {format !== chosen && <kbd>H</kbd>}
          </button>
        ))}
      </div>
      <p class="settings-seen desktop-only">
        {t.seenIn}{' '}
        <span class="settings-chip">
          <Icon name="clock-history" size="small" />
          {t.auditLog} · {now}
        </span>
      </p>
    </div>
  );
}

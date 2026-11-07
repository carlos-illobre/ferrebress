// «Así la tenés» (R1.10): una pastilla por preferencia, con lo que pasa de verdad (con el sistema
// pidiendo no animar, «En el acto»). Tocar una lleva a su renglón; es local, no se espeja.
import { still } from '../../../../platform/motion.ts';
import { serverNow } from '../../../../platform/server/clock.ts';
import { formatTime, formatTimeAs, type TimeFormat } from '../../../../platform/time.ts';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { Say, type Words } from '../../../../ui/say/Say.tsx';
import { moves } from '../../rules.ts';
import { texts } from '../../texts.ts';
import type { SettingsView } from '../../useSettings.ts';

// Ahora, con la hora del servidor si ya la dijo (diseño de 04, § 4).
const now = () => serverNow() ?? new Date();
export const nowText = () => formatTime(now());
export const nowIn = (format: TimeFormat) => formatTimeAs(now(), format);

const go = (id: string) =>
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'center' });

function Chip({ icon, to, words }: { icon: IconName; to: string; words: Words | string }) {
  const said = typeof words === 'string' ? { long: words, short: words } : words;
  return (
    <button type="button" class="settings-chip" onClick={() => go(to)}>
      <Icon name={icon} size="small" />
      <Say words={said} />
    </button>
  );
}

const c = texts.chips;

export function Summary({ view }: { view: SettingsView }) {
  return (
    <div class="settings-summary">
      <span class="settings-for-you">
        <Say words={texts.forYou} />
      </span>
      <div class="settings-chips">
        <span class="settings-chips-label">{texts.summary}</span>
        <Chip
          icon="sparkles"
          to="settings-animations"
          words={moves(view.chosen, view.systemStill) ? c.moving : c.still}
        />
        <Chip icon="clock" to="settings-time" words={nowText()} />
        {view.install && (
          <Chip
            icon="app-window"
            to="settings-install"
            words={view.install === 'installed' ? c.installed : c.browser}
          />
        )}
        {view.offline && (
          <Chip
            icon="wifi-off"
            to="settings-offline"
            words={view.offline.on ? c.offlineOn : c.offlineOff}
          />
        )}
      </div>
    </div>
  );
}

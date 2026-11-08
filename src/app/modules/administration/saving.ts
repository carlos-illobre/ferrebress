// Guardar un ajuste (diseño de 06, § 3 y § 7): lo que no vale se dice antes de mandar; lo guardado se
// muestra con «Deshacer» (salvo el redondeo, R3.4); el cambio de otro, el redondeo que pide confirmar,
// el recálculo que falló y el permiso perdido se dicen en el lugar.
import {
  type AdministrationResponse,
  type SettingKey,
  type SettingState,
  type Settings,
  settingValue,
} from '@ferrebress/shared/contracts/administration';
import { showToast } from '../../ui/toast/Toast.tsx';
import { administrationApi } from './api.ts';
import { shown } from './logic.ts';
import type { Confirm, Note } from './schemas.ts';
import { administrationSettings } from './settings.ts';
import { names, texts } from './texts.ts';

type Saving = {
  latest: { current: AdministrationResponse | undefined };
  put: (key: SettingKey, state: SettingState) => void;
  editable: boolean;
  asked: Confirm | null;
  setSaid: (note: Note | null) => void;
  setAsked: (confirm: Confirm | null) => void;
  refreshPrices: () => void;
};

type Refusal = { error: string } & Record<string, unknown>;

export function saving(deps: Saving) {
  async function save<K extends SettingKey>(key: K, raw: Settings[K], confirmed?: number) {
    if (!deps.editable) return;
    const now = deps.latest.current?.settings[key] as SettingState<K>;
    const value = settingValue(key, raw);
    if (value === undefined)
      return deps.setSaid({ key, kind: 'invalid', text: texts.invalid[key as 'pairingDays'] });
    deps.setSaid(null);
    const result = await administrationApi.save(key, {
      value,
      version: now.version,
      ...(confirmed !== undefined && { confirmed }),
    });
    if (!result.ok) return refused(deps, key, result as Refusal, value);
    deps.put(key, result.data);
    deps.setAsked(null);
    const words = texts.saved(names[key], shown(key, result.data.value as Settings[K]));
    // El redondeo no lleva «Deshacer» (R3.4, E23): se vuelve eligiendo el anterior. Sus ejemplos se
    // vuelven a pedir con el paso nuevo.
    if (key === 'roundingStep') {
      deps.refreshPrices();
      return showToast(words, 'check');
    }
    showToast(words, 'check', {
      label: texts.undo,
      ms: administrationSettings.undoMs,
      run: () => void save(key, now.value),
    });
  }
  return save;
}

function refused(deps: Saving, key: SettingKey, error: Refusal, value: unknown) {
  if (error.error === 'confirm-prices')
    return deps.setAsked({ step: value as number, prices: error.prices as number, failed: false });
  if (error.error === 'recalc-failed' && deps.asked)
    return deps.setAsked({ ...deps.asked, failed: true });
  if (error.error === 'setting-changed') {
    const now = { value: error.value, version: error.version } as SettingState;
    deps.put(key, now);
    deps.setAsked(null);
    const text = texts.changedBy(String(error.by), shown(key, now.value as never));
    return deps.setSaid({ key, kind: 'changed', text });
  }
  const text = error.error === 'forbidden' ? texts.lostPermission : texts.failed;
  deps.setSaid({ key, kind: 'failed', text });
}

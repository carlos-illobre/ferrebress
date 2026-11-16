// Los atajos de Más → Configuración (04 · R1.9, R9.2; 00 · R2.8): las preferencias, volver a lo de
// arranque, el nombre del dispositivo y sus ideas. Las teclas están en keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import { countsOf } from '../mine/rules.ts';
import type { DeviceSettings } from '../useDeviceSettings.ts';

const naming = (model: DeviceSettings) => model.name.draft !== undefined;
const canName = (model: DeviceSettings) =>
  !!model.here && model.mine.state.status !== 'offline' && !naming(model);
const idea = (index: number) => (model: DeviceSettings) => {
  const chosen = model.name.ideas[index];
  return naming(model) && chosen !== undefined && model.name.type(chosen);
};

export const shortcuts = defineShortcuts<DeviceSettings>('device-settings', {
  animations: (model) => model.settings.set({ animations: !model.settings.chosen.animations }),
  otherTimeFormat: (model) =>
    model.settings.set({ timeFormat: model.settings.chosen.timeFormat === 'h24' ? 'h12' : 'h24' }),
  reset: (model) => model.settings.changed && model.settings.reset(),
  rename: (model) => canName(model) && model.name.edit(),
  clearName: (model) => canName(model) && !!model.name.current && model.name.clear(),
  install: (model) => model.settings.install === 'button' && void model.install(),
  closeAll: (model) =>
    model.mine.state.status === 'ready' &&
    countsOf(model.mine.state.data).sessions > 1 &&
    model.closingAll.ask(),
  idea1: idea(0),
  idea2: idea(1),
  idea3: idea(2),
});

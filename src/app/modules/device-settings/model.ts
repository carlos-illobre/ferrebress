// Lo que las vistas usan de este módulo (ADR-019): sus modelos, sus textos y las cuentas que
// muestran. Las vistas no importan nada más del módulo; index.ts es lo que va en el arranque.
export { useInstallOffer, useInstallSheet } from './install-offer.ts';
export { countsOf, lastUseOf, nameOf, type Receipt } from './mine/rules.ts';
export { mineTexts } from './mine/texts.ts';
export type { Mine } from './mine/useMine.ts';
export type { NameModel } from './mine/useName.ts';
export { moves } from './rules.ts';
export { deviceSettingsSettings } from './settings.ts';
export { texts } from './texts.ts';
export { type DeviceSettings, useDeviceSettings } from './useDeviceSettings.ts';
export { installHere, type SettingsView, useSettings } from './useSettings.ts';

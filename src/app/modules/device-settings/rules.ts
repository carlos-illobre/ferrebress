// La regla de Configuración (04 · R1 a R5), sin tecnología: lo de arranque, si algo cambió, el
// resumen de «Así la tenés», qué renglón de instalar toca y si toca ofrecer instalar.
import type { InstallState } from '../../platform/install.ts';
import type { TimeFormat } from '../../platform/time.ts';

export type Preferences = { animations: boolean; timeFormat: TimeFormat };

// De arranque: con movimiento y 24 horas (R2.1, R3.1).
export const defaults: Preferences = { animations: true, timeFormat: 'h24' };

export const isDefault = (preferences: Preferences) =>
  preferences.animations === defaults.animations && preferences.timeFormat === defaults.timeFormat;

// Qué dice el renglón de instalar (R4.1 a R4.3): nada donde no se puede o ya se abrió desde el ícono.
export type InstallRow = 'button' | 'installed' | 'ios' | undefined;

const rows: Partial<Record<InstallState, InstallRow>> = {
  can: 'button',
  installed: 'installed',
  ios: 'ios',
};
export const installRowOf = (state: InstallState): InstallRow => rows[state];

// Lo que pasa de verdad con el movimiento: con el sistema pidiendo no animar, en el acto (R1.10).
export const moves = (preferences: Preferences, systemStill: boolean) =>
  preferences.animations && !systemStill;

// Si toca ofrecer instalar (R4.5 a R4.7): en el celular, con sesión, fuera de pruebas, si se puede,
// una sola vez por celular y sin otra hoja abierta.
export type OfferCase = {
  phone: boolean;
  signedIn: boolean;
  testing: boolean;
  install: InstallState;
  offered: boolean;
  otherSheet: boolean;
};
export const shouldOffer = (c: OfferCase) =>
  c.phone && c.signedIn && !c.testing && c.install === 'can' && !c.offered && !c.otherSheet;

// Los ajustes en la memoria del servidor (diseño de 06, § 1): se cargan y se validan al arrancar, y se
// reemplazan en el mismo pedido que los cambia, solo con una versión mayor. Los leen `sign-in` y
// `device-link` en cada pedido, sin consultar la base.
import {
  type AdministrationResponse,
  initialSettings,
  type SettingKey,
  type Settings,
  type SettingState,
  settingKeyOf,
  settingKeys,
  settingValue,
} from '@ferrebress/shared/contracts/administration';
import type { StoredSetting } from './data.ts';

export type States = AdministrationResponse['settings'];

export class InvalidSetting extends Error {}

export function createMemory() {
  let states: States | undefined;

  const loaded = (): States => {
    if (!states) throw new Error('Los ajustes todavía no se cargaron');
    return states;
  };

  return {
    // Lo guardado, validado con el contrato. Un valor que no vale (una opción que se sacó, una fila
    // tocada a mano) frena el arranque: seguir con lo de arranque alargaría en silencio lo que bajó
    // un Administrador (revisión de seguridad de 06, 1 y 2).
    load(rows: StoredSetting[]): void {
      const initial = initialSettings();
      const next = Object.fromEntries(
        settingKeys.map((key) => [key, { value: initial[key], version: 0 }]),
      ) as States;
      for (const row of rows) {
        const key = settingKeyOf(row.key);
        if (!key) continue;
        const value = settingValue(key, row.value);
        if (value === undefined) throw new InvalidSetting(`El ajuste ${key} guardado no es válido`);
        (next as Record<SettingKey, SettingState>)[key] = { value, version: row.version };
      }
      states = next;
    },

    states: loaded,

    settings: (): Settings => {
      const now = loaded();
      return Object.fromEntries(settingKeys.map((key) => [key, now[key].value])) as Settings;
    },

    // Un cambio confirmado: solo si es más nuevo que lo que hay.
    put<K extends SettingKey>(key: K, state: SettingState<K>): void {
      const now = loaded();
      if (state.version > now[key].version) (now as Record<K, SettingState<K>>)[key] = state;
    },
  };
}

export type Memory = ReturnType<typeof createMemory>;

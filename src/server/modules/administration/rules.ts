// La regla de un cambio de ajuste (06 · R2.2, R3.4): si el valor vale y, en el redondeo, si hace
// falta confirmar cuántos precios cambian. Sin tecnología: recibe lo que necesita.
import { type SettingKey, type Settings, settingValue } from '@ferrebress/shared/contracts/administration';

export type ChangeCheck<K extends SettingKey> =
  | { kind: 'invalid' }
  | { kind: 'same' }
  | { kind: 'confirm'; prices: number }
  | { kind: 'save'; value: Settings[K]; prices: number };

// `prices` es cuántos precios cambian con el valor nuevo (solo el redondeo cambia precios); se
// aplica sin preguntar si no cambia ninguno, y si cambian, solo con el mismo número que vio quien
// confirma (E18, E21, E41).
export function checkChange<K extends SettingKey>(
  key: K,
  raw: unknown,
  current: Settings[K],
  prices: number,
  confirmed: number | undefined,
): ChangeCheck<K> {
  const value = settingValue(key, raw);
  if (value === undefined) return { kind: 'invalid' };
  if (JSON.stringify(value) === JSON.stringify(current)) return { kind: 'same' };
  if (prices > 0 && confirmed !== prices) return { kind: 'confirm', prices };
  return { kind: 'save', value, prices };
}

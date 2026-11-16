// Los ajustes para todos (06 · R1 a R8; diseño de 06, § 2 y § 3): la lista fija, con el valor de
// arranque, las opciones o el rango de cada uno, y la forma de lo que entra y sale de sus rutas. La
// comparten el servidor, que valida y guarda, y la aplicación, que muestra y valida antes de mandar.
// Un capítulo nuevo que trae un ajuste para todos suma su fila (R1.3).
import * as z from 'zod/mini';

export const roundingSteps = [0, 10, 50, 100, 500, 1000, 5000] as const;
export const sessionIdleOptions = [15, 30, 60, 120] as const;
export const sessionMaxOptions = [4, 8, 12, 24] as const;
export const quickMarginRange = { min: 1, max: 10_000, count: 5 } as const;
export const pairingDaysRange = { min: 1, max: 365 } as const;
// Las listas de precios (R8).
export const reviewPercentRange = { min: 1, max: 1000 } as const;
export const goneWarnPercentRange = { min: 1, max: 100 } as const;
export const maxFileMbRange = { min: 1, max: 100 } as const;
export const confirmRowsRange = { min: 1000, max: 10_000_000 } as const;
export const filesMbRange = { min: 10, max: 100_000 } as const;
export const unappliedFileDaysRange = { min: 1, max: 3650 } as const;

const oneOf = (options: readonly number[]) => z.int().check(z.refine((n) => options.includes(n)));
const between = (range: { min: number; max: number }) =>
  z.int().check(z.minimum(range.min), z.maximum(range.max));
const distinct = (list: number[]) => new Set(list).size === list.length;

export type SettingGroup = 'prices' | 'lists' | 'business' | 'access';

// Cada ajuste: su grupo en la pantalla, su valor de arranque y cómo se valida.
export const settingList = {
  roundingStep: { group: 'prices', initial: 1000, schema: oneOf(roundingSteps) },
  quickMargins: {
    group: 'prices',
    initial: [300, 200, 100, 50, 25],
    schema: z
      .array(between(quickMarginRange))
      .check(z.length(quickMarginRange.count), z.refine(distinct)),
  },
  sessionIdle: { group: 'access', initial: 60, schema: oneOf(sessionIdleOptions) },
  sessionMax: { group: 'access', initial: 8, schema: oneOf(sessionMaxOptions) },
  pairingDays: { group: 'access', initial: 30, schema: between(pairingDaysRange) },
  reviewPercent: { group: 'lists', initial: 50, schema: between(reviewPercentRange) },
  goneWarnPercent: { group: 'lists', initial: 20, schema: between(goneWarnPercentRange) },
  maxFileMb: { group: 'lists', initial: 30, schema: between(maxFileMbRange) },
  confirmRows: { group: 'lists', initial: 200_000, schema: between(confirmRowsRange) },
  filesMb: { group: 'lists', initial: 100, schema: between(filesMbRange) },
  unappliedFileDays: { group: 'lists', initial: 30, schema: between(unappliedFileDaysRange) },
} as const satisfies Record<
  string,
  { group: SettingGroup; initial: number | readonly number[]; schema: z.ZodMiniType }
>;

export type SettingKey = keyof typeof settingList;
export type Settings = {
  roundingStep: number;
  quickMargins: number[];
  sessionIdle: number;
  sessionMax: number;
  pairingDays: number;
  reviewPercent: number;
  goneWarnPercent: number;
  maxFileMb: number;
  confirmRows: number;
  filesMb: number;
  unappliedFileDays: number;
};

export const settingKeys = Object.keys(settingList) as SettingKey[];

// Buscada en un Map: una clave como `constructor` o `__proto__` no es un ajuste (diseño de 06, § 3).
const known = new Map(settingKeys.map((key) => [key, key]));
export const settingKeyOf = (raw: string): SettingKey | undefined => known.get(raw as SettingKey);

export const initialSettings = (): Settings => ({
  roundingStep: settingList.roundingStep.initial,
  quickMargins: [...settingList.quickMargins.initial],
  sessionIdle: settingList.sessionIdle.initial,
  sessionMax: settingList.sessionMax.initial,
  pairingDays: settingList.pairingDays.initial,
  reviewPercent: settingList.reviewPercent.initial,
  goneWarnPercent: settingList.goneWarnPercent.initial,
  maxFileMb: settingList.maxFileMb.initial,
  confirmRows: settingList.confirmRows.initial,
  filesMb: settingList.filesMb.initial,
  unappliedFileDays: settingList.unappliedFileDays.initial,
});

// Solo los valores, sin las versiones.
export const valuesOf = (settings: AdministrationResponse['settings']): Settings =>
  Object.fromEntries(settingKeys.map((key) => [key, settings[key].value])) as Settings;

// El valor tal cual se guarda: los márgenes, de mayor a menor (R4.2). `undefined` si no vale.
export function settingValue<K extends SettingKey>(key: K, raw: unknown): Settings[K] | undefined {
  const parsed = settingList[key].schema.safeParse(raw);
  if (!parsed.success) return undefined;
  const value = parsed.data as Settings[K];
  return (Array.isArray(value) ? [...value].sort((a, b) => b - a) : value) as Settings[K];
}

// La cookie de la sesión dura lo que la opción más larga del tope: quien cierra la sesión es el
// servidor (diseño de 06, § 5).
export const longestSessionHours = Math.max(...sessionMaxOptions);

export const saveSettingBody = z.strictObject({
  value: z.unknown(),
  version: z.int().check(z.minimum(0), z.maximum(2 ** 31 - 1)),
  // Cuántos precios cambian, como los vio quien confirma (R3.4, E41).
  confirmed: z.optional(z.int().check(z.minimum(0), z.maximum(2 ** 31 - 1))),
});
export type SaveSettingBody = z.infer<typeof saveSettingBody>;

export type SettingState<K extends SettingKey = SettingKey> = {
  value: Settings[K];
  version: number;
};
export type AdministrationResponse = {
  settings: { [K in SettingKey]: SettingState<K> };
  businessTimeZone: string;
};

// Lo que muestra el panel del redondeo: cuántos precios hay, cuántos cambian con cada paso y unos
// ejemplos. Sin catálogo, no hay precios.
export type RoundingExample = { name: string; calculated: number };
export type RoundingResponse = {
  total: number;
  changes: Record<string, number>;
  examples: RoundingExample[];
};

export type SaveSettingResponse = SettingState;

// Las respuestas de error con lo que la pantalla necesita para decirlo.
export type SettingChanged = SettingState & { by: string };
export type ConfirmPrices = { prices: number };

// Los tipos de acción de Administración (capítulo 06) en Quién hizo qué.
import { noRounding, type SettingKey, settingKeyOf } from '../contracts/administration.ts';
import { stepText } from '../money/money.ts';
import { type Entry, text, thing } from './kinds.ts';

const thousands = (n: number) => n.toLocaleString('es-AR');
// El paso, en centavos; los cambios anotados antes de contar en centavos lo guardaban en pesos, con 0
// como «sin redondeo».
const stepOf = (raw: unknown, inCents: boolean) => {
  const cents = inCents ? Number(raw) : Number(raw) * 100 || noRounding;
  return cents === noRounding ? 'sin redondeo' : stepText(cents);
};

// Cómo se nombra cada ajuste y cómo se escribe su valor.
// `inCents`: el evento anotó el paso del redondeo en centavos (los de antes, en pesos).
const shown: Record<
  SettingKey,
  { name: string; value: (raw: unknown, inCents: boolean) => string }
> = {
  roundingStep: { name: 'el redondeo', value: stepOf },
  quickMargins: {
    name: 'los márgenes rápidos',
    value: (raw) => (Array.isArray(raw) ? `${raw.join(', ')} %` : '—'),
  },
  sessionIdle: { name: 'el tiempo sin uso de la sesión', value: (raw) => `${raw} min` },
  sessionMax: { name: 'el tope de la sesión', value: (raw) => `${raw} h` },
  pairingDays: { name: 'los días del vínculo', value: (raw) => `${raw} días` },
  offlineHours: { name: 'las horas para entrar sin conexión', value: (raw) => `${raw} h` },
  googleAttempts: {
    name: 'los intentos con Google por minuto',
    value: (raw) => `${raw} por minuto`,
  },
  passkeyAttempts: {
    name: 'los intentos con la huella por minuto',
    value: (raw) => `${raw} por minuto`,
  },
  failedAttempts: { name: 'los intentos fallidos por hora', value: (raw) => `${raw} por hora` },
  reviewPercent: { name: 'cuánto cambia un costo para revisar', value: (raw) => `${raw} %` },
  goneWarnPercent: { name: 'cuántas bajas avisan', value: (raw) => `${raw} %` },
  maxFileMb: { name: 'el tamaño máximo de una lista', value: (raw) => `${raw} MB` },
  confirmRows: {
    name: 'desde cuántas filas se avisa',
    value: (raw) => `${thousands(Number(raw))} filas`,
  },
  filesMb: {
    name: 'cuánto ocupan los archivos de las listas',
    value: (raw) => `${thousands(Number(raw))} MB`,
  },
  unappliedFileDays: {
    name: 'los días de una lista que no se aplicó',
    value: (raw) => `${thousands(Number(raw))} días`,
  },
};

export const administrationTypes = {
  // Un ajuste (R2.5): con el anterior y el nuevo; en el redondeo, cuántos precios cambiaron (E19).
  'settings.changed': {
    group: 'administration',
    tone: 'plain',
    icon: 'sliders-horizontal',
    name: 'Cambió un ajuste para todos',
    shows: [],
    says: (e) => {
      const key = settingKeyOf(String(e.data.key));
      if (!key) return [text('Cambió un ajuste para todos')];
      const { name, value } = shown[key];
      const inCents = e.data.cents === true;
      const prices = typeof e.data.prices === 'number' && e.data.prices > 0 ? e.data.prices : 0;
      return [
        text(`Cambió ${name}: `),
        thing(
          `${value(e.changes.value?.before, inCents)} → ${value(e.changes.value?.after, inCents)}`,
        ),
        ...(prices ? [text(` (cambiaron ${thousands(prices)} precios)`)] : []),
      ];
    },
  },
} satisfies Record<string, Entry>;

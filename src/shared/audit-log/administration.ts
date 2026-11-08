// Los tipos de acción de Administración (capítulo 06) en Quién hizo qué.
import { type SettingKey, settingKeyOf } from '../contracts/administration.ts';
import { type Entry, text, thing } from './kinds.ts';

const thousands = (n: number) => n.toLocaleString('es-AR');
const pesos = (n: number) => (n === 0 ? 'sin redondeo' : `$ ${thousands(n)}`);

// Cómo se nombra cada ajuste y cómo se escribe su valor.
const shown: Record<SettingKey, { name: string; value: (raw: unknown) => string }> = {
  roundingStep: { name: 'el redondeo', value: (raw) => pesos(Number(raw)) },
  quickMargins: {
    name: 'los márgenes rápidos',
    value: (raw) => (Array.isArray(raw) ? `${raw.join(', ')} %` : '—'),
  },
  sessionIdle: { name: 'el tiempo sin uso de la sesión', value: (raw) => `${raw} min` },
  sessionMax: { name: 'el tope de la sesión', value: (raw) => `${raw} h` },
  pairingDays: { name: 'los días del vínculo', value: (raw) => `${raw} días` },
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
      const prices = typeof e.data.prices === 'number' && e.data.prices > 0 ? e.data.prices : 0;
      return [
        text(`Cambió ${name}: `),
        thing(`${value(e.changes.value?.before)} → ${value(e.changes.value?.after)}`),
        ...(prices ? [text(` (cambiaron ${thousands(prices)} precios)`)] : []),
      ];
    },
  },
} satisfies Record<string, Entry>;

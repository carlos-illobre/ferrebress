// Los tipos de acción de Configuración (capítulo 04) en Quién hizo qué.
import { type Entry, text, thing } from './kinds.ts';

const named = (value: unknown) => (typeof value === 'string' ? value : null);

export const deviceSettingsTypes = {
  // El nombre de un dispositivo (R9.5): con el anterior y el nuevo. Sin nombre, el dispositivo se
  // llama por su navegador y su sistema, que es el nombre de la acción (su objetivo).
  'device.renamed': {
    group: 'device-settings',
    tone: 'plain',
    icon: 'tag',
    name: 'Le cambió el nombre a un dispositivo',
    shows: [],
    says: (e) => {
      const before = named(e.changes.name?.before);
      const after = named(e.changes.name?.after);
      const label = e.targets.find((target) => target.kind === 'device')?.name ?? '';
      if (!after) return [text('Le sacó el nombre a este dispositivo: '), thing(before ?? label)];
      if (!before) return [text('Le puso nombre a este dispositivo: '), thing(after)];
      return [text('Le cambió el nombre: '), thing(`${before} → ${after}`)];
    },
  },
} satisfies Record<string, Entry>;

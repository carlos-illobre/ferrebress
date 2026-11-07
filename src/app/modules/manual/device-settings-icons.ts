// Los íconos que suma el capítulo «Configuración» del manual (docs/manual/). Lucide 0.460 (licencia
// ISC), los mismos que usa la pantalla, como los de icons.ts.
import type { Shape } from './shape.ts';

export const deviceSettingsIcons: Record<string, Shape[]> = {
  'pencil-line': [
    [
      'path',
      {
        d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
      },
    ],
    ['path', { d: 'm15 5 4 4' }],
  ],
  scissors: [
    ['circle', { cx: '6', cy: '6', r: '3' }],
    ['path', { d: 'M8.12 8.12 12 12' }],
    ['path', { d: 'M20 4 8.12 15.88' }],
    ['circle', { cx: '6', cy: '18', r: '3' }],
    ['path', { d: 'M14.8 14.8 20 20' }],
  ],
};

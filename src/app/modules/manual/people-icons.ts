// Los íconos que suma el capítulo «Personas» del manual (docs/manual/users.md). Lucide 0.460
// (licencia ISC), copiados de docs/design/common/icons/, como los de icons.ts.
import type { Shape } from './shape.ts';

export const peopleIcons: Record<string, Shape[]> = {
  ban: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'm4.9 4.9 14.2 14.2' }],
  ],
  pencil: [
    [
      'path',
      {
        d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
      },
    ],
    ['path', { d: 'm15 5 4 4' }],
  ],
};

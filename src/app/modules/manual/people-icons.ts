// Los íconos que suman los capítulos «Usuarios» y «Quién hizo qué» del manual (docs/manual/). Lucide 0.460
// (licencia ISC), copiados de docs/design/common/icons/, como los de icons.ts.
import type { Shape } from './shape.ts';

export const peopleIcons: Record<string, Shape[]> = {
  ban: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'm4.9 4.9 14.2 14.2' }],
  ],
  film: [
    ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
    ['path', { d: 'M7 3v18' }],
    ['path', { d: 'M3 7.5h4' }],
    ['path', { d: 'M3 12h18' }],
    ['path', { d: 'M3 16.5h4' }],
    ['path', { d: 'M17 3v18' }],
    ['path', { d: 'M17 7.5h4' }],
    ['path', { d: 'M17 16.5h4' }],
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

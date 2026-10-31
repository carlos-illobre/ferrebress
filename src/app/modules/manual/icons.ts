// Los íconos del manual: los del contenido (capítulos, tareas y pasos) y los de su pantalla. Lucide
// 0.460 (licencia ISC), copiados de docs/design/common/icons/. Son datos y no JSX: tools/manual/ los
// lee para rechazar un ícono que no está, y se bajan con la pantalla, así el arranque no crece. Un
// capítulo con un ícono nuevo agrega acá su renglón, o en el archivo de su capítulo
// (people-icons.ts) si este se llena.
import { peopleIcons } from './people-icons.ts';
import type { Shape } from './shape.ts';

export const manualIcons: Record<string, Shape[]> = {
  ...peopleIcons,
  'arrow-left': [
    ['path', { d: 'm12 19-7-7 7-7' }],
    ['path', { d: 'M19 12H5' }],
  ],
  bug: [
    ['path', { d: 'm8 2 1.88 1.88' }],
    ['path', { d: 'M14.12 3.88 16 2' }],
    ['path', { d: 'M9 7.13v-1a3.003 3.003 0 1 1 6 0v1' }],
    ['path', { d: 'M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6' }],
    ['path', { d: 'M12 20v-9' }],
    ['path', { d: 'M6.53 9C4.6 8.8 3 7.1 3 5' }],
    ['path', { d: 'M6 13H2' }],
    ['path', { d: 'M3 21c0-2.1 1.7-3.9 3.8-4' }],
    ['path', { d: 'M20.97 5c0 2.1-1.6 3.8-3.5 4' }],
    ['path', { d: 'M22 13h-4' }],
    ['path', { d: 'M17.2 17c2.1.1 3.8 1.9 3.8 4' }],
  ],
  'chart-column': [
    ['path', { d: 'M3 3v16a2 2 0 0 0 2 2h16' }],
    ['path', { d: 'M18 17V9' }],
    ['path', { d: 'M13 17V5' }],
    ['path', { d: 'M8 17v-3' }],
  ],
  'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
  'chevron-right': [['path', { d: 'm9 18 6-6-6-6' }]],
  'circle-check': [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'm9 12 2 2 4-4' }],
  ],
  clock: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['polyline', { points: '12 6 12 12 16 14' }],
  ],
  'cloud-upload': [
    ['path', { d: 'M12 13v8' }],
    ['path', { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' }],
    ['path', { d: 'm8 17 4-4 4 4' }],
  ],
  'file-text': [
    ['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }],
    ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }],
    ['path', { d: 'M10 9H8' }],
    ['path', { d: 'M16 13H8' }],
    ['path', { d: 'M16 17H8' }],
  ],
  fingerprint: [
    ['path', { d: 'M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4' }],
    ['path', { d: 'M14 13.12c0 2.38 0 6.38-1 8.88' }],
    ['path', { d: 'M17.29 21.02c.12-.6.43-2.3.5-3.02' }],
    ['path', { d: 'M2 12a10 10 0 0 1 18-6' }],
    ['path', { d: 'M2 16h.01' }],
    ['path', { d: 'M21.8 16c.2-2 .131-5.354 0-6' }],
    ['path', { d: 'M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2' }],
    ['path', { d: 'M8.65 22c.21-.66.45-1.32.57-2' }],
    ['path', { d: 'M9 6.8a6 6 0 0 1 9 5.2v2' }],
  ],
  history: [
    ['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }],
    ['path', { d: 'M3 3v5h5' }],
    ['path', { d: 'M12 7v5l4 2' }],
  ],
  info: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M12 16v-4' }],
    ['path', { d: 'M12 8h.01' }],
  ],
  'list-checks': [
    ['path', { d: 'm3 17 2 2 4-4' }],
    ['path', { d: 'm3 7 2 2 4-4' }],
    ['path', { d: 'M13 6h8' }],
    ['path', { d: 'M13 12h8' }],
    ['path', { d: 'M13 18h8' }],
  ],
  'log-in': [
    ['path', { d: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4' }],
    ['polyline', { points: '10 17 15 12 10 7' }],
    ['line', { x1: '15', x2: '3', y1: '12', y2: '12' }],
  ],
  'log-out': [
    ['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }],
    ['polyline', { points: '16 17 21 12 16 7' }],
    ['line', { x1: '21', x2: '9', y1: '12', y2: '12' }],
  ],
  monitor: [
    ['rect', { width: '20', height: '14', x: '2', y: '3', rx: '2' }],
    ['line', { x1: '8', x2: '16', y1: '21', y2: '21' }],
    ['line', { x1: '12', x2: '12', y1: '17', y2: '21' }],
  ],
  package: [
    [
      'path',
      {
        d: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z',
      },
    ],
    ['path', { d: 'M12 22V12' }],
    ['path', { d: 'm3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7' }],
    ['path', { d: 'm7.5 4.27 9 5.15' }],
  ],
  play: [['polygon', { points: '6 3 20 12 6 21 6 3' }]],
  'qr-code': [
    ['rect', { width: '5', height: '5', x: '3', y: '3', rx: '1' }],
    ['rect', { width: '5', height: '5', x: '16', y: '3', rx: '1' }],
    ['rect', { width: '5', height: '5', x: '3', y: '16', rx: '1' }],
    ['path', { d: 'M21 16h-3a2 2 0 0 0-2 2v3' }],
    ['path', { d: 'M21 21v.01' }],
    ['path', { d: 'M12 7v3a2 2 0 0 1-2 2H7' }],
    ['path', { d: 'M3 12h.01' }],
    ['path', { d: 'M12 3h.01' }],
    ['path', { d: 'M12 16v.01' }],
    ['path', { d: 'M16 12h1' }],
    ['path', { d: 'M21 12v.01' }],
    ['path', { d: 'M12 21v-1' }],
  ],
  'refresh-cw': [
    ['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }],
    ['path', { d: 'M21 3v5h-5' }],
    ['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }],
    ['path', { d: 'M8 16H3v5' }],
  ],
  'scan-barcode': [
    ['path', { d: 'M3 7V5a2 2 0 0 1 2-2h2' }],
    ['path', { d: 'M17 3h2a2 2 0 0 1 2 2v2' }],
    ['path', { d: 'M21 17v2a2 2 0 0 1-2 2h-2' }],
    ['path', { d: 'M7 21H5a2 2 0 0 1-2-2v-2' }],
    ['path', { d: 'M8 7v10' }],
    ['path', { d: 'M12 7v10' }],
    ['path', { d: 'M17 7v10' }],
  ],
  search: [
    ['circle', { cx: '11', cy: '11', r: '8' }],
    ['path', { d: 'm21 21-4.3-4.3' }],
  ],
  settings: [
    [
      'path',
      {
        d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
      },
    ],
    ['circle', { cx: '12', cy: '12', r: '3' }],
  ],
  'shopping-cart': [
    ['circle', { cx: '8', cy: '21', r: '1' }],
    ['circle', { cx: '19', cy: '21', r: '1' }],
    [
      'path',
      { d: 'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12' },
    ],
  ],
  'sliders-horizontal': [
    ['line', { x1: '21', x2: '14', y1: '4', y2: '4' }],
    ['line', { x1: '10', x2: '3', y1: '4', y2: '4' }],
    ['line', { x1: '21', x2: '12', y1: '12', y2: '12' }],
    ['line', { x1: '8', x2: '3', y1: '12', y2: '12' }],
    ['line', { x1: '21', x2: '16', y1: '20', y2: '20' }],
    ['line', { x1: '12', x2: '3', y1: '20', y2: '20' }],
    ['line', { x1: '14', x2: '14', y1: '2', y2: '6' }],
    ['line', { x1: '8', x2: '8', y1: '10', y2: '14' }],
    ['line', { x1: '16', x2: '16', y1: '18', y2: '22' }],
  ],
  smartphone: [
    ['rect', { width: '14', height: '20', x: '5', y: '2', rx: '2', ry: '2' }],
    ['path', { d: 'M12 18h.01' }],
  ],
  tags: [
    ['path', { d: 'm15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19' }],
    [
      'path',
      {
        d: 'M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z',
      },
    ],
    ['circle', { cx: '6.5', cy: '9.5', r: '.5', fill: 'currentColor' }],
  ],
  truck: [
    ['path', { d: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2' }],
    ['path', { d: 'M15 18H9' }],
    [
      'path',
      { d: 'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14' },
    ],
    ['circle', { cx: '17', cy: '18', r: '2' }],
    ['circle', { cx: '7', cy: '18', r: '2' }],
  ],
  'user-round': [
    ['circle', { cx: '12', cy: '8', r: '5' }],
    ['path', { d: 'M20 21a8 8 0 0 0-16 0' }],
  ],
  users: [
    ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
    ['circle', { cx: '9', cy: '7', r: '4' }],
    ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }],
    ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
  ],
  'wifi-off': [
    ['path', { d: 'M12 20h.01' }],
    ['path', { d: 'M8.5 16.429a5 5 0 0 1 7 0' }],
    ['path', { d: 'M5 12.859a10 10 0 0 1 5.17-2.69' }],
    ['path', { d: 'M19 12.859a10 10 0 0 0-2.007-1.523' }],
    ['path', { d: 'M2 8.82a15 15 0 0 1 4.177-2.643' }],
    ['path', { d: 'M22 8.82a15 15 0 0 0-11.288-3.764' }],
    ['path', { d: 'm2 2 20 20' }],
  ],
  workflow: [
    ['rect', { width: '8', height: '8', x: '3', y: '3', rx: '2' }],
    ['path', { d: 'M7 11v4a2 2 0 0 0 2 2h4' }],
    ['rect', { width: '8', height: '8', x: '13', y: '13', rx: '2' }],
  ],
  x: [
    ['path', { d: 'M18 6 6 18' }],
    ['path', { d: 'm6 6 12 12' }],
  ],
  zap: [
    [
      'path',
      {
        d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
      },
    ],
  ],
};

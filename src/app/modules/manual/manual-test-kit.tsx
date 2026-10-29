// Lo que comparten las pruebas del manual: un manual de prueba chico (un capítulo escrito con tareas
// de los dos dispositivos, uno que falta y uno que lleva a otro) y un fetch de mentira que contesta
// /manual/ y anota cada pedido.
import type {
  Chapter,
  ManualIndex,
  SearchTask,
  TaskSummary,
} from '@ferrebress/shared/contracts/manual';
import { cleanup, render, screen } from '@testing-library/preact';
import { type Mock, vi } from 'vitest';
import { navigate } from '../../platform/router.ts';
import { Manual } from './screens/Manual/Manual.tsx';

const capture = (
  scene: string,
  device: 'computer' | 'phone',
  label: string,
  point: [number, number] = [70, 40],
) => ({
  scene,
  device,
  width: device === 'computer' ? 1100 : 585,
  height: device === 'computer' ? 619 : 1266,
  point,
  label,
});

export const chapter: Chapter = {
  id: 'sign-in',
  name: 'Entrar',
  intro: { computer: 'Entrás en la computadora.', phone: 'Entrás en el celular.' },
  tasks: [
    {
      id: 'phone',
      device: 'computer',
      title: 'Entrar con el celular',
      icon: 'qr-code',
      tag: { long: 'La forma más rápida', short: 'La más rápida' },
      clip: 'phone-to-computer',
      note: 'No escribís nada.',
      steps: [
        {
          text: 'Mirá el código.',
          icon: 'qr-code',
          capture: capture('desktop-entrance', 'computer', 'El código'),
        },
        {
          text: 'Tocá «Escanear».',
          icon: 'qr-code',
          capture: capture('phone-entrance', 'phone', 'Escanear', [30, 80]),
        },
        { text: 'Poné la huella.', icon: 'fingerprint' },
      ],
      tips: ['El código cambia cada minuto.', 'Los dos en el mismo Wi-Fi.'],
    },
    {
      id: 'google',
      device: 'computer',
      title: 'Entrar con Google',
      icon: 'log-in',
      steps: [
        { text: 'Elegí tu cuenta.', icon: 'user-round' },
        {
          text: 'Listo.',
          icon: 'circle-check',
          capture: capture('desktop-entrance', 'computer', 'Google'),
        },
      ],
      tips: [],
    },
    {
      id: 'offline',
      device: 'phone',
      title: 'Entrar sin internet',
      icon: 'wifi-off',
      steps: [
        {
          text: 'Prendé la opción.',
          icon: 'wifi-off',
          capture: capture('phone-more', 'phone', 'La opción'),
        },
        { text: 'Poné la huella.', icon: 'fingerprint' },
      ],
      tips: ['Hasta 24 horas.'],
    },
    {
      id: 'fingerprint',
      device: 'phone',
      title: 'Entrar con la huella',
      icon: 'fingerprint',
      steps: [{ text: 'Poné el dedo.', icon: 'fingerprint' }],
      tips: [],
    },
  ],
};

const summary = ({ note, tips, steps, ...rest }: Chapter['tasks'][number]): TaskSummary => ({
  ...rest,
  steps: steps.length,
});

export const index: ManualIndex = {
  version: 'app-test',
  chapters: [
    { id: 'sign-in', name: 'Entrar', icon: 'log-in', tasks: chapter.tasks.map(summary) },
    { id: 'sales', name: 'Vender', icon: 'shopping-cart' },
    // Escrito, pero solo para la computadora: en el celular no sale.
    {
      id: 'stock',
      name: 'Stock',
      icon: 'package',
      tasks: [{ id: 'count', device: 'computer', title: 'Contar', icon: 'package', steps: 1 }],
    },
    {
      id: 'offline',
      name: 'Trabajar sin conexión',
      icon: 'wifi-off',
      goesTo: { chapter: 'sign-in', tasks: { phone: 'offline' } },
    },
  ],
};

const searchOf = (device: 'computer' | 'phone'): SearchTask[] =>
  chapter.tasks
    .filter((task) => task.device === device)
    .map((task) => ({
      chapter: 'sign-in',
      task: task.id,
      title: task.title,
      ...(task.note && { note: task.note }),
      texts: [...task.steps.map((step) => step.text), ...task.tips],
    }));

export type Answer = unknown | 'offline' | 'missing' | 'broken';

const replies: Record<string, () => Response> = {
  missing: () => new Response('', { status: 404 }),
  broken: () => new Response('{ roto'),
  image: () => new Response(new Blob(['webp'])),
};

function reply(answer: Answer): Response {
  if (answer === 'offline') throw new TypeError('Failed to fetch');
  const made = typeof answer === 'string' ? replies[answer] : undefined;
  return made ? made() : new Response(JSON.stringify(answer));
}

// Contesta cada archivo de /manual/ (lo que no está en `files`, 404) y anota lo pedido.
export function serveManual(changes: Record<string, Answer> = {}) {
  const files: Record<string, Answer> = {
    'index.json': index,
    'sign-in.json': chapter,
    'search-computer.json': searchOf('computer'),
    'search-phone.json': searchOf('phone'),
    ...changes,
  };
  const asked: string[] = [];
  const fetch = vi.fn(async (path: string) => {
    asked.push(path);
    const name = path.replace('/manual/', '');
    const known = name in files ? files[name] : undefined;
    return reply(known ?? (name.startsWith('media/') ? 'image' : 'missing'));
  });
  vi.stubGlobal('fetch', fetch);
  let urls = 0;
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn(() => `blob:manual/${++urls}`),
      revokeObjectURL: vi.fn(),
    }),
  );
  return { asked, fetch, files };
}

// El ancho y «reducir movimiento»; `changeWidth` simula girar el celular o achicar la ventana.
export function media({ narrow = false, still = false } = {}) {
  const listeners: (() => void)[] = [];
  const query = { narrow };
  vi.stubGlobal('matchMedia', (asked: string) => ({
    get matches() {
      return asked.includes('max-width') ? query.narrow : still;
    },
    addEventListener: (_: string, listener: () => void) => listeners.push(listener),
    removeEventListener: vi.fn(),
  }));
  return {
    changeWidth(now: boolean) {
      query.narrow = now;
      for (const listener of listeners) listener();
    },
  };
}

export function show({ device = 'computer', testing = true, at = '/manual' } = {}): {
  long: string;
  short: string;
  go: Mock<(open: number) => void>;
} {
  cleanup();
  navigate(at, { replace: true });
  const back = {
    long: 'Volver a la entrada',
    short: 'Entrada',
    go: vi.fn<(open: number) => void>(),
  };
  render(<Manual device={device as 'computer' | 'phone'} testing={testing} back={back} />);
  return back;
}

export const loaded = () => screen.findByRole('heading', { name: '¿Qué querés hacer?' });

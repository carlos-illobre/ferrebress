// «Algo salió mal» (00 · R9): cuando algo falla sin que la persona pueda hacer nada, se arma el
// aviso con un código, la hora, los últimos pasos (qué se tocó y en qué pantalla, sin lo escrito) y
// una captura que tapa lo marcado data-private (R9.4). «Avisar y seguir» lo guarda en el
// dispositivo, uno solo, para mandarlo cuando exista Mejoras y errores (R9.2); salir lo borra.
import { forget, store } from '../../../platform/device/storage.ts';
import { createStore } from '../../../platform/store.ts';

export type Step = { at: number; where: string; what: string };
export type Crash = { code: string; at: number; steps: Step[]; capture?: string };

export const crash = createStore<Crash | undefined>(undefined);

const reportKey = 'crash-report';
const keptSteps = 6;
const steps: Step[] = [];

// Dónde está la persona: la parte abierta del menú o la entrada.
const where = () =>
  document.querySelector('[aria-current="page"] .part-name')?.textContent ??
  (document.querySelector('.sign-in') ? 'La entrada' : 'La aplicación');

// El nombre de lo tocado, sin la tecla del atajo.
function labelOf(element: Element): string {
  const label = element.getAttribute('aria-label');
  if (label) return label;
  const copy = element.cloneNode(true) as Element;
  for (const key of copy.querySelectorAll('kbd')) key.remove();
  return String(copy.textContent).trim();
}

function remember(what: string): void {
  steps.unshift({ at: Date.now(), where: where(), what });
  steps.length = Math.min(steps.length, keptSteps);
}

function onClick(event: Event): void {
  const target = (event.target as Element).closest('button, a, [role="button"]');
  if (target && !target.closest('[data-private]')) remember(`Tocó «${labelOf(target)}»`);
}

function onChange(event: Event): void {
  const field = event.target as HTMLInputElement;
  const name = field.getAttribute('aria-label') ?? field.placeholder;
  if (name) remember(`Escribió en «${name}» (lo escrito no se manda)`);
}

const code = () => `F-${String(Math.floor(1000 + Math.random() * 9000))}`;

export async function reportCrash(): Promise<void> {
  if (crash.get()) return;
  const shown: Crash = { code: code(), at: Date.now(), steps: [...steps] };
  crash.set(shown);
  const capture = await captureScreen().catch(() => undefined);
  if (capture && crash.get() === shown) crash.set({ ...shown, capture });
}

// La captura se saca con html-to-image, que se baja recién cuando hace falta.
async function captureScreen(): Promise<string> {
  const { toJpeg } = await import('html-to-image');
  return toJpeg(document.body, {
    quality: 0.6,
    pixelRatio: 0.5,
    filter: (node) => !(node instanceof HTMLElement && node.dataset.private !== undefined),
  });
}

export function saveReport(report: Crash): void {
  store(reportKey, report);
}

export const forgetReport = () => forget(reportKey);

// Escucha lo que toca la persona y los errores que nadie atrapó; devuelve cómo dejar de escuchar.
export function watchCrashes(): () => void {
  const failed = () => void reportCrash();
  document.addEventListener('click', onClick, true);
  document.addEventListener('change', onChange, true);
  addEventListener('error', failed);
  addEventListener('unhandledrejection', failed);
  return () => {
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('change', onChange, true);
    removeEventListener('error', failed);
    removeEventListener('unhandledrejection', failed);
  };
}

// Instalar la aplicación en el dispositivo (04 · R4): si el navegador puede, si ya está instalada y
// cómo se pide. El navegador avisa que se puede con `beforeinstallprompt`, una sola vez y temprano:
// por eso se escucha desde el arranque y se guarda el evento. Se le saca su propio cartel, para que
// el único ofrecimiento sea el de la aplicación. Nada pide a la red.
import { forget, readStored, store } from './device/storage.ts';
import { createStore } from './store.ts';

// can: se puede pedir. installed-here: abierta desde su ícono. installed: instalada, pero abierta en
// el navegador. ios: el iPhone, que no tiene botón (se instala a mano). cannot: no se sabe instalar.
export type InstallState = 'can' | 'installed-here' | 'installed' | 'ios' | 'cannot';

type PromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
type Related = { getInstalledRelatedApps?: () => Promise<unknown[]> };

const installedKey = 'installed';
let saved: PromptEvent | undefined;

export const installState = createStore<InstallState>('cannot');

const fromIcon = () =>
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true;
const isApple = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

function first(): InstallState {
  if (fromIcon()) return 'installed-here';
  if (isApple()) return 'ios';
  return readStored<boolean>(installedKey) === true ? 'installed' : 'cannot';
}

// Se llama una vez al arrancar, antes de dibujar.
export function watchInstall(): void {
  installState.set(first());
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    saved = event as PromptEvent;
    // Si el navegador vuelve a ofrecerla, es que la desinstalaron desde el sistema.
    forget(installedKey);
    installState.set('can');
  });
  addEventListener('appinstalled', () => {
    saved = undefined;
    store(installedKey, true);
    if (installState.get() !== 'installed-here') installState.set('installed');
  });
}

// Pregunta al navegador si la aplicación ya está instalada, aunque se la haya abierto en él. Se
// hace recién al abrir Configuración, que es donde importa: al arrancar demoraba lo demás.
export function askInstalled(): void {
  void (navigator as Related).getInstalledRelatedApps?.().then(
    (apps) => {
      if (apps.length > 0 && installState.get() === 'cannot') installState.set('installed');
    },
    () => undefined,
  );
}

// Pide instalar. El evento del navegador sirve una sola vez: después hay que esperar otro.
export async function install(): Promise<'accepted' | 'dismissed'> {
  const event = saved;
  if (!event) return 'dismissed';
  saved = undefined;
  const outcome = await event
    .prompt()
    .then(() => event.userChoice)
    .then(
      (choice) => choice.outcome,
      () => 'dismissed' as const,
    );
  installState.set(outcome === 'accepted' ? 'installed' : 'cannot');
  return outcome;
}

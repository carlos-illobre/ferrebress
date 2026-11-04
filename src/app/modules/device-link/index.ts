// El módulo del capítulo 03 en la aplicación: el vínculo entre el celular y la computadora. Arranca con
// la aplicación (`watchDeviceLink`) y escucha a los otros sin que lo conozcan (diseño de 03, § 11.1).
// Lo que muestran las pantallas sale de `linkRuntime`. El vínculo se baja aparte, después del
// arranque (diseño de 01, § 10).
export { linkRuntime } from './current.ts';
export { frameLink } from './frame-link.tsx';
export type { PairingState } from './machine/types.ts';
export type { Runtime } from './runtime.ts';

export function watchDeviceLink(): () => void {
  let stop: (() => void) | undefined;
  let stopped = false;
  void import('./start.ts').then(({ startDeviceLink }) => {
    if (!stopped) stop = startDeviceLink();
  });
  return () => {
    stopped = true;
    stop?.();
  };
}

// Cuánto tarda ir y volver por el directo (R4.2): se lee de la conexión, solo mientras se muestra,
// cada tanto (settings.ts).
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../../../platform/store.ts';
import { linkRuntime } from '../current.ts';
import { deviceLinkSettings } from '../settings.ts';

export function useRoundTrip(on: boolean): number | undefined {
  const runtime = useStore(linkRuntime);
  // local: la latencia que mide este dispositivo.
  const [ms, setMs] = useState<number>();
  useEffect(() => {
    if (!on || !runtime) return setMs(undefined);
    const read = () => void runtime.roundTripMs().then((value) => setMs(value));
    read();
    const timer = setInterval(read, deviceLinkSettings.roundTripEveryMs);
    return () => clearInterval(timer);
  }, [on, runtime]);
  return ms;
}

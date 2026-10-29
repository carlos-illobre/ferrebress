// Hasta cuándo se puede entrar sin conexión en esta entrada (15 · R2.1, R2.4): solo en el celular y
// sin conexión. Se vuelve a calcular cada minuto, al volver a la vista y cuando cambia el permiso,
// así el aviso se apaga solo cuando se cumple el plazo (E08).
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../../../platform/store.ts';
import { offlineUntil, permit } from './permit.ts';

const minute = 60_000;

export function useOfflineEntry(online: boolean, phone: boolean): Date | undefined {
  const current = useStore(permit);
  const [until, setUntil] = useState<Date | undefined>();
  useEffect(() => {
    if (online || !phone) return setUntil(undefined);
    const check = () => setUntil(offlineUntil());
    check();
    const timer = setInterval(check, minute);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [online, phone, current]);
  return until;
}

// «hoy 21:40», «mañana 9:40» o «el martes 9:40», en la hora del celular.
export function whenText(until: Date, now = new Date()): string {
  const time = `${until.getHours()}:${String(until.getMinutes()).padStart(2, '0')}`;
  const days = Math.round(
    (new Date(until).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) /
      (24 * 60 * minute),
  );
  if (days === 0) return `hoy ${time}`;
  if (days === 1) return `mañana ${time}`;
  return `el ${until.toLocaleDateString('es-AR', { weekday: 'long' })} ${time}`;
}

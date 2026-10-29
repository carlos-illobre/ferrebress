// Hasta cuándo se puede entrar sin conexión en esta entrada (15 · R2.1, R2.4): solo en el celular y
// sin conexión. Se vuelve a calcular cada minuto, al volver a la vista y cuando cambia el permiso,
// así el aviso se apaga solo cuando se cumple el plazo (E08).
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../../../platform/store.ts';
import { offlineOption, offlineUntil } from './option.ts';

const minute = 60_000;

export function useOfflineEntry(online: boolean, phone: boolean): Date | undefined {
  const current = useStore(offlineOption);
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

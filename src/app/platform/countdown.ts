// Una cuenta regresiva de segundos desde un momento (los códigos que duran un minuto: la entrada con
// el celular, 01 · R2.5; vincular, 03 · R1.3). Se mueve sola, sin pedidos.
import { useEffect, useState } from 'preact/hooks';
import { platformSettings } from './settings.ts';

// Los segundos que le quedan. Puede llegar después de la última marca del reloj: hasta la
// siguiente, va entero (1:00, nunca 1:01).
export const secondsLeft = (now: number, since: number, lasts: number): number =>
  Math.max(0, lasts - Math.floor(Math.max(0, now - since) / 1000));

export function useCountdown(since: number, lasts: number): number {
  const [now, setNow] = useState(Date.now()); // local: el reloj de la cuenta, de este dispositivo
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), platformSettings.countdownTickMs);
    return () => clearInterval(timer);
  }, []);
  return secondsLeft(now, since, lasts);
}

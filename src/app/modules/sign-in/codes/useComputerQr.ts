// El código QR de la computadora para entrar con el celular, sin HTML (R2.5): el código que manda el
// servidor (useComputerCode), su dibujo y los segundos que le quedan, que solo se muestran.
import { codeSeconds } from '@ferrebress/shared/contracts/sign-in';
import { useQr } from '../../../platform/camera/use-qr.ts';
import { useCountdown } from '../../../platform/countdown.ts';
import { linkUrl } from './qr.ts';
import { useComputerCode } from './useComputerCode.ts';

export function useComputerQr() {
  const { code, read, since } = useComputerCode(true);
  const left = useCountdown(since, codeSeconds);
  return {
    qr: useQr(code ? linkUrl(code) : undefined),
    read,
    left,
    // Cuánto del tiempo del código queda, de 0 a 1.
    share: left / codeSeconds,
  };
}

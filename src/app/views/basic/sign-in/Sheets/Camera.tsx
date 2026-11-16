// «Escanear código QR» en el celular (R2.7): la cámara común, que al leer un código de esta
// aplicación se cierra y sigue como si se hubiera abierto su dirección.

import { codeOf, texts } from '../../../../modules/sign-in/model.ts';
import { Camera as Reader } from '../../ui/camera/Camera.tsx';

export function Camera({
  onCode,
  onClose,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  return <Reader texts={texts.camera} read={codeOf} onCode={onCode} onClose={onClose} />;
}

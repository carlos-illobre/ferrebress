// Una hoja abierta en el celular es un paso de la historia (diseño del manual, § 5): el botón atrás la
// cierra. Se dibuja solo mientras la hoja está abierta.
import { useBackStep } from '../../../../platform/back-step.ts';

export function SheetStep({ close }: { close: () => void }) {
  useBackStep(close);
  return null;
}

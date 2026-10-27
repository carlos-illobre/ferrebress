// La hoja de lo pendiente en el celular: sube desde abajo, por encima del menú, que queda a la
// vista; deslizarla hacia abajo la cierra.
import { Sheet } from '../../../../ui/sheet/Sheet.tsx';
import { useFrame } from '../../context.ts';
import { texts } from '../../texts.ts';
import { Pending } from '../Pending/Pending.tsx';

export function PhoneSheets() {
  const { panels } = useFrame();
  if (panels.open === 'phonePending')
    return (
      <Sheet title={texts.pending.title} onClose={panels.close} className="frame-sheet">
        <Pending />
      </Sheet>
    );
  return null;
}

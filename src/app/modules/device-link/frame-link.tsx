// Las piezas del vínculo que el marco pone en su lugar (diseño de 03, § 13): los dos indicadores, en el
// arranque, y lo que abren (el detalle), que llega con el vínculo, aparte del arranque (`start.ts`).
import { useStore } from '../../platform/store.ts';
import type { FrameLink } from '../frame/index.ts';
import { linkOver } from './current.ts';
import { detailOpen } from './detail.ts';
import { PhoneIndicator, SideIndicator } from './screens/Indicator/Indicator.tsx';

function LinkOver() {
  const loaded = useStore(linkOver);
  const open = useStore(detailOpen);
  return open && loaded ? <loaded.Over /> : null;
}

export const frameLink: FrameLink = { Side: SideIndicator, Phone: PhoneIndicator, Over: LinkOver };

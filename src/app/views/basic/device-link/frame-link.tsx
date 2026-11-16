// Las piezas del vínculo que el marco pone en su lugar (diseño de 03, § 13): los dos indicadores, en el
// arranque, y lo que abren (el detalle), que se baja recién cuando el vínculo llegó y algo se abre.

import type { FrameLink } from '../../../modules/device-link/model.ts';
import { useOverShown } from '../../../modules/device-link/model.ts';
import { useLoaded } from '../../../platform/view/lazy.ts';
import { PhoneIndicator, SideIndicator } from './Indicator/Indicator.tsx';

function LoadedOver() {
  const loaded = useLoaded(() => import('./Detail/Over.tsx'));
  return loaded ? <loaded.Layer /> : null;
}

function LinkOver() {
  return useOverShown() ? <LoadedOver /> : null;
}

export const frameLink: FrameLink = { Side: SideIndicator, Phone: PhoneIndicator, Over: LinkOver };

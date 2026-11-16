// Las piezas del vínculo que el marco pone en su lugar (diseño de 03, § 13): los dos indicadores, en el
// arranque, y lo que abren (el detalle), que se baja recién cuando el vínculo llegó y algo se abre.

import {
  detailOpen,
  linkRuntime,
  reading,
  unpairAsked,
} from '../../../modules/device-link/model.ts';
import type { FrameLink } from '../../../modules/frame/index.ts';
import { useLoaded } from '../../../platform/lazy.ts';
import { useStore } from '../../../platform/store.ts';
import { PhoneIndicator, SideIndicator } from './Indicator/Indicator.tsx';

function LoadedOver() {
  const loaded = useLoaded(() => import('./Detail/Over.tsx'));
  return loaded ? <loaded.Layer /> : null;
}

function LinkOver() {
  const runtime = useStore(linkRuntime);
  const open = useStore(detailOpen);
  const read = useStore(reading);
  const asked = useStore(unpairAsked);
  return (open || read || asked) && runtime ? <LoadedOver /> : null;
}

export const frameLink: FrameLink = { Side: SideIndicator, Phone: PhoneIndicator, Over: LinkOver };

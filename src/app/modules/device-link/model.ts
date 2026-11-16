// Lo que las vistas usan de este módulo (ADR-019): sus modelos, sus textos y las cuentas que
// muestran. Las vistas no importan nada más del módulo; index.ts es lo que va en el arranque.

// El lugar del vínculo en el marco.
export type { FrameLink } from '../frame/index.ts';
export { linkRuntime, linkStrip } from './current.ts';
export { type Act, choicesOf } from './detail/choices.ts';
export { detailOpen, reading, unpairAsked } from './detail/open.ts';
export { useRoundTrip } from './detail/round-trip.ts';
export { clock, day, detailTexts, duration, since } from './detail/texts.ts';
export { hours, lanes, useStrip } from './detail/today.ts';
export { useLinkDetail } from './detail/useLinkDetail.ts';
export type { PairingState } from './machine/types.ts';
export { usePairCode } from './pairing/code.ts';
export { useReadCode } from './pairing/useReadCode.ts';
export type { Runtime } from './runtime.ts';
export { deviceLinkSettings } from './settings.ts';
export { createStrip } from './strip.ts';
export { type Status, texts } from './texts.ts';
export { useLinkView } from './use-link.ts';
export { type LinkView, onPhone } from './view.ts';

// Lo que comparten los paneles: si se puede tocar, la opción que se mira antes de elegirla y cómo se
// avisa que se mira otra.
import type { Settings } from '@ferrebress/shared/contracts/administration';
import type { Administration } from '../../useAdministration.ts';

export type PanelProps = { view: Administration; settings: Settings };

export const locked = (view: Administration) => !view.editable;
export const looked = (view: Administration, key: keyof Settings) =>
  view.looking?.key === key ? view.looking.value : undefined;
export const onLook = (view: Administration, key: keyof Settings) => (value: number | undefined) =>
  view.setLooking(value === undefined ? undefined : { key, value });

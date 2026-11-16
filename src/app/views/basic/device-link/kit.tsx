// Las partes del vínculo que las pruebas miran y que no tienen rol ni texto propio (ADR-019).
const parts = {
  qrDrawn: '.qr-box > svg path',
  qrRead: '.qr-box.read',
  boxLabel: '.link-box > span',
  offlineBoxLabel: '.link-box[data-offline] > span',
  short: '.short',
  boxRate: '.link-box .link-rate',
  pillRate: '.link-pill .link-pill-rate',
  primary: '[data-primary]',
  scrim: '.sheet-scrim',
  sheet: '.link-sheet',
} as const;
export const one = (name: keyof typeof parts, root: ParentNode = document) =>
  root.querySelector<HTMLElement>(parts[name]);

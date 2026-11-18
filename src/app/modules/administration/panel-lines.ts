// Lo que muestran los paneles del redondeo, su confirmación y los márgenes rápidos (06 · R3, R4),
// resuelto para cualquier vista: cuántos precios cambian con el paso que se mira, cómo quedan unos
// ejemplos (sin precios, el de la regla), a cuánto vende cada tecla y dónde queda la zona del negocio.
import type { RoundingResponse, Settings } from '@ferrebress/shared/contracts/administration';
import { noRounding } from '@ferrebress/shared/contracts/administration';
import { centsText, priceText, stepText } from '@ferrebress/shared/money/money';
import { exampleCost, roundedTo, sellsAt, shown, thousands } from './logic.ts';
import type { Confirm } from './schemas.ts';
import { texts } from './texts.ts';

const t = texts.rounding;
// El precio de ejemplo de la regla, cuando todavía no hay precios (§ 12, 1).
const example = { name: t.example, calculated: 1_500_100 };

// `now`, el paso de ahora; `step`, el que se mira (el de ahora si no se mira otro).
export function roundingLines(prices: RoundingResponse | undefined, now: number, step: number) {
  const changes = (value: number) => prices?.changes[String(value)] ?? 0;
  const seeing = step !== now;
  const examples = prices?.examples.length ? prices.examples : [example];
  return {
    big: {
      label: seeing ? t.ifChosen(shown('roundingStep', step)) : t.now(shown('roundingStep', now)),
      value: seeing
        ? changes(step)
          ? t.change(thousands(changes(step)))
          : t.noChange
        : t.prices(thousands(prices?.total ?? 0)),
      looking: seeing,
    },
    now,
    // Cada paso para elegir: cómo se dice y cuántos precios cambian con él.
    optionText: (value: number) => (value === noRounding ? t.none : stepText(value)),
    optionEffect: (value: number) => (value === now ? t.current : thousands(changes(value))),
    showcase: {
      title: seeing ? t.showWith(shown('roundingStep', step)) : t.showToday,
      noPrices: !prices?.examples.length,
      rows: examples.map((one) => {
        const after = roundedTo(one.calculated, step);
        return {
          name: one.name,
          calculated: t.calculated(centsText(BigInt(one.calculated))),
          price: priceText(after, step),
          changes: seeing && after !== roundedTo(one.calculated, now),
        };
      }),
    },
  };
}

// La confirmación: cuántos cambian y, de los primeros tres ejemplos, de cuánto a cuánto.
export const confirmLines = (
  prices: RoundingResponse | undefined,
  now: number,
  asked: Confirm,
) => ({
  title: t.confirmTitle(shown('roundingStep', asked.step)),
  prices: thousands(asked.prices),
  count: t.changing(thousands(asked.prices), thousands(prices?.total ?? asked.prices)),
  examples: (prices?.examples ?? []).slice(0, 3).map((one) => ({
    name: one.name,
    change: `${priceText(roundedTo(one.calculated, now), now)} → ${priceText(roundedTo(one.calculated, asked.step), asked.step)}`,
  })),
});

export const marginLines = (settings: Settings) => ({
  keys: settings.quickMargins.map((margin, i) => ({
    number: i + 1,
    label: texts.margins.key(i + 1),
    value: thousands(margin),
    sells: priceText(sellsAt(margin, settings.roundingStep), settings.roundingStep),
  })),
  example: texts.margins.example(
    priceText(exampleCost, 100),
    shown('roundingStep', settings.roundingStep),
  ),
});

// Dónde queda la zona: «America/Argentina/Buenos_Aires», «Buenos Aires».
export const zonePlace = (zone: string) => (zone.split('/').at(-1) as string).replace(/_/g, ' ');

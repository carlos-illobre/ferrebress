// Las reglas de lo mío, sin HTML (04 · R1.8, R8, R9): cómo se llama cada dispositivo, qué corta
// «Se me perdió» o «Quitar» en otro celular (para pintarlo antes y decirlo en el recibo después) y las
// cuentas de arriba.
import {
  type MyComputer,
  type MyDevice,
  type MyDevicesResponse,
  shownName,
} from '@ferrebress/shared/contracts/device-settings';
import { sinceOf } from '../../../platform/time.ts';
import { mineTexts as t } from './texts.ts';

// Su nombre o, sin nombre, su navegador y su sistema (R9.1).
export const nameOf = shownName;

export type CutPiece = { what: 'session' | 'computer' | 'passkey'; text: string };

// Lo que se corta en otro celular: su sesión, las de las computadoras que hizo entrar con su código y
// su huella (02 · R5.6, R5.7). «Quitar» la huella de otro celular corta lo mismo (R6.2).
export const cutsOf = (device: MyDevice): CutPiece[] => [
  ...(device.session ? [{ what: 'session' as const, text: t.receipt.session }] : []),
  ...device.computers.map((computer: MyComputer) => ({
    what: 'computer' as const,
    text: computer.here ? t.receipt.thisComputer : t.receipt.computer(nameOf(computer)),
  })),
  ...(device.passkey ? [{ what: 'passkey' as const, text: t.receipt.passkey }] : []),
];

export type Receipt = { key: string; title: string; cuts: string[] };

export const receiptOf = (device: MyDevice, how: 'remove' | 'lost'): Receipt => ({
  key: device.key,
  title: how === 'lost' ? t.receipt.lost(nameOf(device)) : t.receipt.removed(nameOf(device)),
  cuts: cutsOf(device).map((piece) => piece.text),
});

// Las cuentas de arriba: las sesiones de los otros dispositivos (también las computadoras que entraron
// con un código, salvo esta) y los otros celulares con huella.
export function countsOf(mine: MyDevicesResponse) {
  const computers = [...mine.here.computers, ...mine.others.flatMap((d) => d.computers)].filter(
    (computer) => !computer.here,
  );
  return {
    sessions: mine.others.filter((d) => d.session).length + computers.length,
    passkeys: mine.others.filter((d) => d.passkey).length,
  };
}

// El último uso de una huella, como lo dice la gente (R6.1).
export const lastUseOf = (lastUsedAt: number | null, now: number) =>
  lastUsedAt ? t.passkey.used(sinceOf(lastUsedAt, now)) : t.passkey.neverUsed;

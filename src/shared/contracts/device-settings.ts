// La forma de lo que entra y sale de las rutas de lo mío (diseño de 04b, § 3). La usan el servidor para
// validar y la aplicación para armar los pedidos.
import * as z from 'zod/mini';
import { cleanText, lettersIn, sameText } from '../text/clean.ts';

// El nombre de un dispositivo: hasta 30 letras, contadas igual en la aplicación, el servidor y la base
// (R9.3).
export const deviceNameMax = 30;

// Lo que llega puede traer espacios o caracteres que se sacan: el largo de antes de limpiar tiene su
// propio tope, más holgado.
export const deviceNameBody = z.object({ name: z.string().check(z.maxLength(200)) });

// El nombre limpio; nulo si queda vacío (borrarlo); `undefined` si tiene más de 30 letras.
export function cleanDeviceName(raw: string): string | null | undefined {
  const clean = cleanText(raw, deviceNameMax + 1);
  return clean !== null && lettersIn(clean) > deviceNameMax ? undefined : clean;
}

// Si otro dispositivo ya se llama igual, sin distinguir mayúsculas (R9.3, E54).
export const isRepeated = (name: string, others: readonly string[]) =>
  others.some((other) => sameText(other, name));

export type DeviceNameResponse = { name: string | null; repeated: boolean };

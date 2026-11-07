// La forma de lo que entra y sale de las rutas de lo mío (diseño de 04b, § 3). La usan el servidor para
// validar y la aplicación para armar los pedidos.
import * as z from 'zod/mini';
import { cleanText, lettersIn, sameText } from '../text/clean.ts';
import type { Way } from './users.ts';

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

// Cómo se llama un dispositivo: el nombre que le pusieron o, sin nombre, su navegador y su sistema
// (R9.1). La única vez que se escribe: la usan Usuarios y Configuración.
export const shownName = (device: { deviceLabel: string; deviceName?: string | undefined }) =>
  device.deviceName ?? device.deviceLabel;

export type DeviceNameResponse = { name: string | null; repeated: boolean };

// Lo mío (R1.8, R6 a R8): las horas, en milisegundos desde 1970 (hora del servidor). Ningún
// identificador del dispositivo: las sesiones por el suyo y los celulares por `key`, opaco.
export type MySession = { id: string; way: Way; createdAt: number; lastUsedAt: number };
export type MyPasskey = { createdAt: number; lastUsedAt: number | null };

// Una computadora que un celular hizo entrar con su código, por su sesión.
// `here`: es este dispositivo, que entró con el código de ese celular; cortarlo lo corta también.
export type MyComputer = {
  deviceLabel: string;
  deviceName?: string;
  session: MySession;
  here?: true;
};

// Otro dispositivo propio, con su sesión abierta y su huella juntas (R1.8). `key` nombra al celular
// para «Quitar» y «Se me perdió»: el de su huella o, sin huella, el de su sesión.
export type MyDevice = {
  key: string;
  deviceLabel: string;
  deviceName?: string;
  isPhone: boolean;
  session: MySession | null;
  passkey: MyPasskey | null;
  computers: MyComputer[];
};

// Este dispositivo: su nombre, y en el celular su huella (la propia, la de otra persona o ninguna)
// con las computadoras que hizo entrar. `names`: los nombres de los otros dispositivos de la
// ferretería, para avisar mientras se escribe si se repite (E54).
export type MyDevicesResponse = {
  here: {
    deviceLabel: string;
    deviceName?: string;
    isPhone: boolean;
    passkey: 'mine' | 'other' | 'none';
    since?: MyPasskey;
    computers: MyComputer[];
  };
  others: MyDevice[];
  names: string[];
};

export const cutMineBody = z.object({ how: z.enum(['remove', 'lost']) });

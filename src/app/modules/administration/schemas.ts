// La forma de lo que Administración pone en valores con nombre (diseño de 06, § 7): lo que llega del
// otro dispositivo sin esa forma no entra.
import type {
  AdministrationResponse,
  RoundingResponse,
  SettingKey,
} from '@ferrebress/shared/contracts/administration';
import * as z from 'zod/mini';

// Lo que se dice en el lugar de un ajuste: un valor que no vale, el cambio de otro o un error.
export type Note = { key: SettingKey; kind: 'invalid' | 'changed' | 'failed'; text: string };

// La confirmación del redondeo abierta (R3.4): a qué paso y cuántos precios cambian; `failed`, si el
// recálculo no se pudo (R3.5, E22).
export type Confirm = { step: number; prices: number; failed: boolean };

const objectWith = <T>(field: string) =>
  z.custom<T>((value) => typeof value === 'object' && value !== null && field in value);

export const schemas = {
  response: objectWith<AdministrationResponse>('settings'),
  rounding: objectWith<RoundingResponse>('changes'),
  note: z.nullable(objectWith<Note>('kind')),
  confirm: z.nullable(objectWith<Confirm>('step')),
};

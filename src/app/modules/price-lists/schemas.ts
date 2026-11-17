// La forma de lo que las listas de precios ponen en valores con nombre (ADR-019): lo que llega del otro
// dispositivo sin esa forma no entra.
import type { ReadersResponse } from '@ferrebress/shared/contracts/price-lists';
import * as z from 'zod/mini';

const objectWith = <T>(field: string) =>
  z.custom<T>((value) => typeof value === 'object' && value !== null && field in value);

export const searchText = z.string().check(z.maxLength(200));

export const schemas = {
  readers: objectWith<ReadersResponse>('readers'),
};

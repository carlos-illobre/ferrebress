// Lo que llega del otro dispositivo sin la forma de Lectores no entra.
import { describe, expect, it } from 'vitest';
import { schemas, searchText } from './schemas.ts';

describe('la forma de lo espejado de las listas de precios', () => {
  it('los lectores son un objeto con `readers`; lo buscado, un texto corto', () => {
    expect(schemas.readers.safeParse({ readers: [] }).success).toBe(true);
    expect(schemas.readers.safeParse(null).success).toBe(false);
    expect(schemas.readers.safeParse('x').success).toBe(false);
    expect(schemas.readers.safeParse({}).success).toBe(false);
    expect(searchText.safeParse('a'.repeat(201)).success).toBe(false);
  });
});

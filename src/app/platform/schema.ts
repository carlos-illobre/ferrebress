// Piezas de esquema para lo que se baja aparte del arranque (diseño de 01, § 10). zod está en el
// arranque, y cada tipo de esquema que usa cualquier parte de la aplicación queda en él: `z.enum`,
// `z.literal`, `z.boolean` y `z.union` sumarían 1 KB que el arranque no usa. Estas hacen lo mismo con
// lo que el arranque ya tiene (`z.custom`), y `tagged` elige el esquema por un campo, como un
// `discriminatedUnion`: más barato y con un error por variante.
import * as z from 'zod/mini';

// Uno de estos valores.
export const oneOf = <const T extends readonly (string | number)[]>(values: T) =>
  z.custom<T[number]>((value) => values.includes(value as T[number]));

export const flag = z.custom<boolean>((value) => typeof value === 'boolean');

type Schemas = Record<string, z.ZodMiniType>;
export type TaggedOf<S extends Schemas> = { [K in keyof S]: z.infer<S[K]> }[keyof S];

// Un objeto que dice qué es en `field`: se valida con el esquema de ese nombre; uno sin nombre
// conocido no tiene forma.
export function tagged<S extends Schemas>(field: string, schemas: S) {
  return (value: unknown): { success: true; data: TaggedOf<S> } | { success: false } => {
    const tag = (value as Record<string, unknown> | null)?.[field];
    const schema =
      typeof tag === 'string' && Object.hasOwn(schemas, tag) ? schemas[tag] : undefined;
    const parsed = schema?.safeParse(value);
    return parsed?.success
      ? { success: true, data: parsed.data as TaggedOf<S> }
      : { success: false };
  };
}

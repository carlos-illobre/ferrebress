// Los campos que cada módulo suma a la cabecera X-Ferrebress (diseño de 03, § 3.5): una letra y un
// valor corto, calculados en memoria para la respuesta de cada pedido. Así lo que puede esperar viaja
// en las respuestas que la aplicación ya recibe, sin canal ni consultas (la forma `piggyback`). La
// cabecera no sabe qué significa ningún campo: sumar uno no la toca.
import {
  fieldLetter,
  fieldValue,
  reservedFields,
} from '@ferrebress/shared/contracts/server-header';
import type { Context } from 'hono';

type Field = (c: Context) => string | undefined;

export function createHeaderFields() {
  const fields = new Map<string, Field>();
  return {
    contribute(letter: string, field: Field): void {
      if (!fieldLetter.test(letter) || reservedFields.has(letter) || fields.has(letter))
        throw new Error(`La letra «${letter}» no está libre para la cabecera`);
      fields.set(letter, field);
    },
    // Los de esta respuesta; un valor que no tiene la forma de un campo es un error de programación.
    collect(c: Context): Record<string, string> {
      const collected: Record<string, string> = {};
      for (const [letter, field] of fields) {
        const value = field(c);
        if (value === undefined) continue;
        if (!fieldValue.test(value))
          throw new Error(`El campo «${letter}» no tiene forma de campo`);
        collected[letter] = value;
      }
      return collected;
    },
  };
}

export type HeaderFields = ReturnType<typeof createHeaderFields>;

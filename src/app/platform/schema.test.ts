// Las piezas de esquema que no suman al arranque.
import { describe, expect, it } from 'vitest';
import * as z from 'zod/mini';
import { flag, oneOf, tagged } from './schema.ts';

describe('piezas de esquema', () => {
  it('uno de estos valores, y un sí o no', () => {
    expect(oneOf(['a', 1]).safeParse(1).success).toBe(true);
    expect(oneOf(['a', 1]).safeParse('b').success).toBe(false);
    expect(flag.safeParse(false).success).toBe(true);
    expect(flag.safeParse('false').success).toBe(false);
  });

  it('elige el esquema por un campo', () => {
    const parse = tagged('t', {
      a: z.strictObject({ t: oneOf(['a']), n: z.number() }),
      b: z.strictObject({ t: oneOf(['b']) }),
    });
    expect(parse({ t: 'a', n: 1 })).toEqual({ success: true, data: { t: 'a', n: 1 } });
    expect(parse({ t: 'a' }).success).toBe(false);
    expect(parse({ t: 'c' }).success).toBe(false);
    expect(parse({ t: 'toString' }).success).toBe(false);
    expect(parse(null).success).toBe(false);
    expect(parse({ t: 3 }).success).toBe(false);
  });
});

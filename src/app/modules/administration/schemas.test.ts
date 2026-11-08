import { describe, expect, it } from 'vitest';
import { schemas } from './schemas.ts';

describe('lo que Administración espeja', () => {
  it('lo que llega sin su forma no entra', () => {
    expect(schemas.response.safeParse({ settings: {} }).success).toBe(true);
    expect(schemas.response.safeParse(null).success).toBe(false);
    expect(schemas.rounding.safeParse({ changes: {} }).success).toBe(true);
    expect(schemas.note.safeParse(null).success).toBe(true);
    expect(schemas.note.safeParse({ kind: 'changed' }).success).toBe(true);
    expect(schemas.confirm.safeParse({ step: 500 }).success).toBe(true);
    expect(schemas.confirm.safeParse('x').success).toBe(false);
  });
});

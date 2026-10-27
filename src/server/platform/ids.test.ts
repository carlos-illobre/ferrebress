import { describe, expect, it } from 'vitest';
import { newId } from './ids.ts';

describe('los identificadores', () => {
  it('son UUID v7 con la hora adelante, así se ordenan por tiempo', () => {
    const first = newId({ now: () => new Date('2026-10-27T12:00:00Z') });
    const later = newId({ now: () => new Date('2026-10-27T12:00:01Z') });
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(first.slice(0, 13)).toBe('01a17d3b-4a00'); // 1.793.102.400.000 ms
    expect(first < later).toBe(true);
  });
});

// Elegir roles (02 · R7.5): lo que va a poder mientras los roles todavía no llegaron.
import { describe, expect, it } from 'vitest';
import { abilitiesOf } from './role-picks.ts';

describe('elegir roles', () => {
  it('mientras no llegaron los roles, no va a poder nada', () => {
    expect(abilitiesOf(undefined, ['r1']).every((one) => !one.on && one.from === '')).toBe(true);
  });
});

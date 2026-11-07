// Las reglas de lo mío: qué corta cada celular, el recibo y las cuentas (04 · R1.8, R8).
import type { MyDevice } from '@ferrebress/shared/contracts/device-settings';
import { describe, expect, it } from 'vitest';
import { countsOf, cutsOf, lastUseOf, receiptOf } from './rules.ts';

const session = { id: 's', way: 'google' as const, createdAt: 0, lastUsedAt: 0 };
const phone: MyDevice = {
  key: 'k',
  deviceLabel: 'Chrome en Android',
  isPhone: true,
  session,
  passkey: null,
  computers: [{ deviceLabel: 'Chrome en Windows', deviceName: 'Caja', session }],
};

describe('lo que corta cada celular', () => {
  it('device-settings-E49, R8.1: su sesión, lo que hizo entrar y su huella, si tiene', () => {
    expect(cutsOf(phone).map((cut) => cut.what)).toEqual(['session', 'computer']);
    expect(receiptOf(phone, 'lost')).toEqual({
      key: 'k',
      title: 'Cortaste Chrome en Android',
      cuts: ['Su sesión', 'La sesión de Caja, que entró con su código'],
    });
    const withPasskey = { ...phone, passkey: { createdAt: 0, lastUsedAt: null } };
    expect(receiptOf(withPasskey, 'remove').cuts.at(-1)).toBe('Su huella');
    const here = { deviceLabel: 'x', isPhone: true, passkey: 'mine' as const, computers: [] };
    expect(countsOf({ here, others: [phone, withPasskey], names: [] })).toEqual({
      sessions: 4,
      passkeys: 1,
    });
    expect(lastUseOf(null, 0)).toBe('Todavía no se usó');
    // Esta computadora, que entró con el código del celular: se corta también, y no se cuenta.
    const thisOne = { deviceLabel: 'Chrome en Windows', session, here: true as const };
    const withThis = { ...phone, computers: [thisOne] };
    expect(receiptOf(withThis, 'lost').cuts).toEqual([
      'Su sesión',
      'La sesión de esta computadora: volvés a la entrada',
    ]);
    expect(countsOf({ here, others: [withThis], names: [] }).sessions).toBe(1);
  });
});

// Los textos que cambian con la cantidad o con quién (maquetas de 02).
import { describe, expect, it } from 'vitest';
import { cardTexts, doneTexts as done, dialogTexts as t } from './texts.ts';

describe('los textos de Usuarios', () => {
  it('lo que pasa al dar de baja, según lo que tiene', () => {
    expect(t.deactivateSessions(0)).toBe('No tiene sesiones abiertas.');
    expect(t.deactivateSessions(1)).toContain('Se cierran sus 1 sesión');
    expect(t.deactivatePhones(0)).toBe('No tiene celulares con huella.');
    expect(t.deactivatePhones(2)).toContain('Se quitan sus 2 celulares con huella');
  });

  it('«Cerrar todas», de una o de varias, la propia o la de otro', () => {
    expect(t.closeAllTitle(1, 'Ana')).toBe('¿Cerrar la sesión de Ana?');
    expect(t.closeAllLead(true)).toContain('menos la de este dispositivo');
    expect(t.closeAllLead(false)).toContain('le roban el celular');
    expect(t.openSessions(1)).toBe('sesión abierta');
    expect(t.phonesOf(1)).toBe('1 celular');
  });

  it('lo que se dice al terminar', () => {
    expect(done.nameCleared(true)).toBe('Nombre borrado: se ve su correo');
    expect(cardTexts.passkeys(1)).toBe('1 registrada');
    expect(cardTexts.devices(1)).toBe('1 con sesión');
    expect(done.closedAll(0)).toBe('No había sesiones abiertas');
    expect(done.closedAll(1)).toBe('Se cerró la sesión');
    expect(done.phoneRemoved(false)).toBe('Celular quitado: ya no entra con la huella');
    expect(done.cut('Chrome en Android', 'Ana', 0, true)).toBe(
      'Cortado: Chrome en Android de Ana. Se le quitó la huella',
    );
  });
});

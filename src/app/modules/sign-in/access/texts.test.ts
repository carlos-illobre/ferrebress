// Lo que se dice al cerrar y cortar, igual en Usuarios y en Configuración.
import { describe, expect, it } from 'vitest';
import { accessTexts as t } from './texts.ts';

describe('lo que se dice al cerrar y cortar', () => {
  it('según cuántas sesiones y si tenía huella', () => {
    expect(t.closedAll(0)).toBe('No había sesiones abiertas');
    expect(t.closedAll(1)).toBe('Se cerró la sesión');
    expect(t.closedAll(3)).toBe('Se cerraron las 3 sesiones');
    expect(t.phoneRemoved(false)).toBe('Celular quitado: ya no entra con la huella');
    expect(t.cut('Chrome en Android', 'Ana', 0, true)).toBe(
      'Cortado: Chrome en Android de Ana. Se le quitó la huella',
    );
    expect(t.cut('Celu', 'Ana', 2, false)).toBe('Cortado: Celu de Ana. Se cerraron sus 2 sesiones');
  });
});

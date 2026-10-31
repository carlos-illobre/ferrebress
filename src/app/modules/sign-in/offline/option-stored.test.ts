// La opción de trabajar sin conexión guardada antes de los roles (02 · R7.9): se lee sin roles ni
// permisos, que trae el próximo contacto con el servidor.
import { describe, expect, it, vi } from 'vitest';

describe('la opción guardada antes de los roles', () => {
  it('se completa sin roles ni permisos', async () => {
    localStorage.setItem(
      'offline-option',
      JSON.stringify({
        person: { userId: 'u1', name: 'Eva', role: 'Administrador' },
        revoked: false,
      }),
    );
    vi.resetModules();
    const { offlineOption } = await import('./option.ts');
    expect(offlineOption.get()?.person).toMatchObject({
      userId: 'u1',
      name: 'Eva',
      roles: [],
      permissions: [],
      rolesChangedBy: null,
    });
    localStorage.clear();
  });
});

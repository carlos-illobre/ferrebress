// Lo que tiene de roles una persona de las pruebas: Administrador, con todos los permisos (02 · R7.4),
// como la primera persona de una instalación.
import { permissionIds } from '@ferrebress/shared/contracts/permissions';

export const administrator = {
  roles: [{ id: '0190a000-0000-7000-8000-00000000a001', name: 'Administrador' }],
  permissions: [...permissionIds],
  rolesChangedBy: null,
  rolesChangedAt: null,
};

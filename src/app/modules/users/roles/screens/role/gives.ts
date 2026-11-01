// Lo que da acceso al guardar un rol, en palabras, para la hoja de confirmar quién es (R3.8; diseño
// de 02, § 20): así no pasa escondido un cambio que da acceso entre otros.
import { permissionOf } from '@ferrebress/shared/contracts/permissions';
import { type Draft, givesAccess } from '../../draft.ts';
import { rolesTexts as t } from '../../texts.ts';

export function whatItGives(draft: Draft, nameOf: (id: string) => string): string[] {
  const { people, permissions, isNew } = givesAccess(draft);
  const name = draft.name.trim();
  return [
    ...(isNew ? [t.createsRole(name)] : []),
    ...(!isNew && permissions.length > 0
      ? [t.givesPermission(name, permissions.map((id) => `«${permissionOf(id).name}»`).join(', '))]
      : []),
    ...(people.length > 0 ? [t.givesRole(name, people.map(nameOf).join(', '))] : []),
  ];
}

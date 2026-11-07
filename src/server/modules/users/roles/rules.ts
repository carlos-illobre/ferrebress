// Las reglas de los roles, sin tecnología (02 · R7, R1.3; diseño de 02, §§ 16 y 19): cómo se limpia
// un nombre o una descripción, quién tiene más permisos que quién, si un cambio da algo y si deja al
// sistema sin quien administre.
import { cleanText } from '@ferrebress/shared/text/clean';

// Un nombre o una descripción, limpios como cualquier texto que ven otros; vacío es ninguno.
export const cleanRoleText = (text: string | null | undefined, max: number): string | null =>
  cleanText(text, max);

// R7.11: `target` tiene algún permiso que `asking` no tiene.
export const outranks = (target: readonly string[], asking: readonly string[]): boolean =>
  target.some((permission) => !asking.includes(permission));

// R3.8: después hay algún permiso que antes no estaba; dar algo pide confirmar quién es.
export const gives = (before: readonly string[], after: readonly string[]): boolean =>
  after.some((permission) => !before.includes(permission));

// Quién administra, contado en la base: personas activas que ya entraron con cada permiso, y si
// quien hace el cambio tiene cada uno.
export type Administration = {
  managers: number;
  roleManagers: number;
  askingManages: boolean;
  askingManagesRoles: boolean;
};

// R1.3: nadie se quita a sí mismo esos permisos, y nunca queda nadie con alguno de ellos.
export function administrationProblem(
  before: Administration,
  after: Administration,
): 'self' | 'last-administrator' | undefined {
  const lostOwn =
    (before.askingManages && !after.askingManages) ||
    (before.askingManagesRoles && !after.askingManagesRoles);
  if (lostOwn) return 'self';
  if (after.managers === 0 || after.roleManagers === 0) return 'last-administrator';
  return undefined;
}

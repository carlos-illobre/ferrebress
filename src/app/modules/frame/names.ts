// Cómo se nombra a quien entró en el marco: sus iniciales y sus roles, como se leen debajo del nombre
// (02 · R7.5).
export { initials } from '../../platform/text.ts';

export const roleNames = (person: { roles: { name: string }[] }) =>
  person.roles.map((role) => role.name).join(', ');

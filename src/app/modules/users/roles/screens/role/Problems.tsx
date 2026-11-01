// Lo que no se pudo guardar (02 · R7.3, R7.5, E56, E65; maqueta users-roles/final): arriba, en una
// línea, qué hay que corregir; al lado de cada cosa, su motivo. También el aviso de que otra persona
// cambió el rol mientras se armaba (diseño de 02, § 19).
import { permissionOf } from '@ferrebress/shared/contracts/permissions';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import type { DraftErrors, PersonError } from '../../draft.ts';
import { rolesTexts as t } from '../../texts.ts';

// El motivo de cada cosa, en su lugar.
export const nameProblem = (error: DraftErrors['name']) =>
  error === 'role-name-taken' ? t.nameTaken : t.noName;

// Una que ya no está (la borraron mientras se armaba el rol) no tiene nombre para mostrar.
export function personProblem(error: PersonError, person: PersonRow | undefined) {
  if (error === 'person-missing') return t.missing;
  const name = (person as PersonRow).displayName;
  if (error === 'no-roles') return t.lastRole(name);
  return error === 'too-many-roles' ? t.tooMany(name) : t.inactive(name);
}

export const selfProblem = (permission: string) => t.self(permissionOf(permission as never).name);

// Qué hay que corregir, en palabras: el nombre, los permisos, el permiso propio y cada persona.
function which(errors: DraftErrors, people: PersonRow[]) {
  const nameOf = (id: string) => {
    const person = people.find((one) => one.id === id);
    if (!person) return t.someoneGone;
    return person.self ? t.yourRole : person.displayName;
  };
  return [
    ...(errors.name ? [t.theName] : []),
    ...(errors.permissions ? [t.thePermissions] : []),
    ...(errors.self ? [`«${permissionOf(errors.self).name}»`] : []),
    ...Object.keys(errors.people ?? {}).map(nameOf),
  ];
}

export function Problems(props: {
  errors: DraftErrors | undefined;
  notice: string | undefined;
  people: PersonRow[];
}) {
  if (props.notice)
    return (
      <p class="role-notice" role="status">
        <Icon name="info" size="small" />
        {props.notice}
      </p>
    );
  const shown = props.errors ? which(props.errors, props.people) : [];
  if (shown.length === 0) return null;
  return (
    <p class="role-problems" role="alert" data-private="">
      <Icon name="triangle-alert" size="small" />
      {t.problems(shown.join(', '))}
    </p>
  );
}

// Lo que no se pudo guardar (02 · R7.3, R7.5, E56, E65), arriba de los pasos: todo junto, con el
// mismo texto que va al lado de cada cosa. También el aviso de que otra persona cambió el rol
// mientras se armaba (diseño de 02, § 19).
import { permissionOf } from '@ferrebress/shared/contracts/permissions';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import type { DraftErrors } from '../draft.ts';
import { rolesTexts as t } from '../texts.ts';

// El texto de cada problema, el mismo arriba y en su lugar.
export const nameProblem = (error: DraftErrors['name']) =>
  error === 'role-name-taken' ? t.nameTaken : t.noName;

// Una que ya no está (la borraron mientras se armaba el rol) no tiene nombre para mostrar.
export function personProblem(error: string, person: PersonRow | undefined) {
  if (error === 'person-missing') return t.missing;
  const name = (person as PersonRow).displayName;
  return error === 'no-roles' ? t.lastRole(name) : t.inactive(name);
}

export const selfProblem = (permission: string) => t.self(permissionOf(permission as never).name);

function lines(errors: DraftErrors, people: PersonRow[]) {
  return [
    ...(errors.name ? [nameProblem(errors.name)] : []),
    ...(errors.permissions ? [t.noPermissionsError] : []),
    ...(errors.self ? [selfProblem(errors.self)] : []),
    ...Object.entries(errors.people ?? {}).map(([id, error]) =>
      personProblem(
        error,
        people.find((one) => one.id === id),
      ),
    ),
  ];
}

export function Problems(props: {
  errors: DraftErrors | undefined;
  notice: string | undefined;
  people: PersonRow[];
}) {
  const shown = props.errors ? lines(props.errors, props.people) : [];
  if (props.notice)
    return (
      <p class="role-notice" role="status">
        <Icon name="info" size="small" />
        {props.notice}
      </p>
    );
  if (shown.length === 0) return null;
  return (
    <div class="role-problems" role="alert" data-private="">
      <Icon name="triangle-alert" size="small" />
      <div>
        <b>{t.problems}</b>
        <ul>
          {shown.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

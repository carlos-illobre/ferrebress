// «1 Información del rol» (02 · R7.3): en el celular, el resumen arriba (pedido de Carlos); el nombre
// y la descripción, que puede quedar vacía, con cuánto queda de las 200 letras. En la computadora el cursor arranca en el nombre; Enter guarda.
import { maxRoleDescription, maxRoleName } from '@ferrebress/shared/contracts/roles';
import type { Draft, DraftErrors } from '../../../../../modules/users/model.ts';
import { rolesTexts as t } from '../../../../../modules/users/model.ts';
import { nameProblem } from './Problems.tsx';
import { RoleSummary } from './RoleSummary.tsx';

type Props = {
  draft: Draft;
  change: (draft: Draft) => void;
  errors: DraftErrors | undefined;
};

export function RoleInfo({ draft, change, errors }: Props) {
  const count = draft.description.length;
  return (
    <section class="role-step" aria-labelledby="role-info">
      <header class="role-step-head">
        <span class="role-step-number">1</span>
        <h3 id="role-info">{t.info}</h3>
      </header>
      <RoleSummary draft={draft} />
      <label class="role-field">
        <span>{t.name}</span>
        <input
          // En la computadora el cursor arranca acá y Enter guarda: lo hace la navegación del
          // teclado (00 · R2.2, R2.6).
          data-autofocus=""
          value={draft.name}
          maxLength={maxRoleName}
          placeholder={t.namePlaceholder}
          aria-invalid={errors?.name ? 'true' : undefined}
          onInput={(event) => change({ ...draft, name: event.currentTarget.value })}
        />
        {errors?.name && <small class="role-error">{nameProblem(errors.name)}</small>}
      </label>
      <label class="role-field">
        <span>
          {t.description} <i>{t.descriptionHint}</i>
        </span>
        <textarea
          value={draft.description}
          maxLength={maxRoleDescription}
          rows={3}
          placeholder={t.descriptionPlaceholder}
          onInput={(event) => change({ ...draft, description: event.currentTarget.value })}
        />
        <small class={count >= maxRoleDescription ? 'role-count full' : 'role-count'}>
          {t.count(count, maxRoleDescription)}
        </small>
      </label>
    </section>
  );
}

// «1 Información del rol» (02 · R7.3): en el celular, el resumen arriba (pedido de Carlos); el nombre
// y la descripción, que puede quedar vacía, con cuánto queda de las 200 letras. En la computadora el cursor arranca en el nombre; Enter guarda.
import { type RoleScreenModel, rolesTexts as t } from '../../../../../modules/users/model.ts';
import { RoleSummary } from './RoleSummary.tsx';

export function RoleInfo({ role }: { role: RoleScreenModel }) {
  const { draft, change, info } = role;
  return (
    <section class="role-step" aria-labelledby="role-info">
      <header class="role-step-head">
        <span class="role-step-number">1</span>
        <h3 id="role-info">{t.info}</h3>
      </header>
      <RoleSummary summary={role.summary} />
      <label class="role-field">
        <span>{t.name}</span>
        <input
          // En la computadora el cursor arranca acá y Enter guarda: lo hace la navegación del
          // teclado (00 · R2.2, R2.6).
          data-autofocus=""
          value={draft.name}
          maxLength={info.limits.name}
          placeholder={t.namePlaceholder}
          aria-invalid={info.nameError ? 'true' : undefined}
          onInput={(event) => change({ ...draft, name: event.currentTarget.value })}
        />
        {info.nameError && <small class="role-error">{info.nameError}</small>}
      </label>
      <label class="role-field">
        <span>
          {t.description} <i>{t.descriptionHint}</i>
        </span>
        <textarea
          value={draft.description}
          maxLength={info.limits.description}
          rows={3}
          placeholder={t.descriptionPlaceholder}
          onInput={(event) => change({ ...draft, description: event.currentTarget.value })}
        />
        <small class={info.descriptionFull ? 'role-count full' : 'role-count'}>{info.count}</small>
      </label>
    </section>
  );
}

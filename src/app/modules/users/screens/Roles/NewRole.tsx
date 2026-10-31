// Un rol nuevo (R7.3), también al duplicar otro: su nombre, su descripción, que puede quedar vacía,
// y sus permisos, agrupados por parte (R7.1). No se guarda hasta tocar «Crear el rol».
import type { PermissionId } from '@ferrebress/shared/contracts/permissions';
import { useState } from 'preact/hooks';
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { createRole } from '../../role-actions.ts';
import { roleTexts as t } from '../../role-texts.ts';
import { useUsersContext } from '../../state.ts';
import { Permissions, toggled } from './Permissions.tsx';
import './RoleCard.css';

function Problem({ text }: { text: string | undefined }) {
  if (!text) return null;
  return (
    <p class="users-field-error" role="alert">
      <Icon name="triangle-alert" size="small" />
      {text}
    </p>
  );
}

export function NewRole() {
  const users = useUsersContext();
  const start = users.draft;
  const [name, setName] = useState(start?.name ?? '');
  const [description, setDescription] = useState(start?.description ?? '');
  const [chosen, setChosen] = useState<string[]>(start?.permissions ?? []);
  const [error, setError] = useState<string>();
  const close = () => {
    users.setDraft(undefined);
    users.setRoleCard(undefined);
  };
  const create = async () => {
    if (!name.trim()) return setError(t.noName);
    if (chosen.length === 0) return setError(t.noPermissions);
    const draft = {
      name: name.trim(),
      description: description.trim() || null,
      permissions: chosen,
    };
    const id = await createRole(users, draft);
    if (!id) return undefined;
    users.setDraft(undefined);
    return users.setRoleCard(id);
  };
  return (
    <aside class="role-card role-new" aria-label={t.newTitle}>
      <h3>{t.newTitle}</h3>
      <label class="users-field">
        <span>{t.name}</span>
        <input
          value={name}
          maxLength={40}
          data-autofocus=""
          onInput={(event) => {
            setName(event.currentTarget.value);
            setError(undefined);
          }}
        />
      </label>
      <label class="users-field">
        <span>{t.description}</span>
        <input
          value={description}
          maxLength={200}
          placeholder={t.descriptionPlaceholder}
          onInput={(event) => setDescription(event.currentTarget.value)}
        />
      </label>
      <h4 class="role-what">{t.whatItDoes}</h4>
      <Permissions
        chosen={chosen}
        onToggle={(id: PermissionId) => {
          setChosen(toggled(chosen, id));
          setError(undefined);
        }}
      />
      <Problem text={error} />
      <div class="role-card-foot">
        <Button look="plain" doing={t.cancel} onPress={close}>
          {t.cancel}
        </Button>
        <Button look="action" icon="shield" doing={t.create} onPress={create} primary>
          {t.create}
        </Button>
      </div>
    </aside>
  );
}

// La pantalla de un rol, nuevo o que existe (02 · R7.13; maqueta users-roles/final): el camino para
// volver, el título, los botones y, debajo, los tres pasos y la vista previa. Lo que hace vive en su
// modelo (useRoleScreen); acá solo se muestra.

import { type Draft, rolesTexts as t, useRoleScreen } from '../../../../../modules/users/model.ts';
import { isPhone } from '../../../../../platform/device/device.ts';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { PhoneLight } from '../../../frame/index.ts';
import { Discard } from './Discard.tsx';
import './RoleScreen.css';
import './RolePhone.css';
import './RoleSteps.css';
import './RolePermissions.css';
import './RolePreview.css';
import { Problems } from './Problems.tsx';
import { PhoneBar, RoleActions } from './RoleActions.tsx';
import { RoleHolders } from './RoleHolders.tsx';
import { RoleInfo } from './RoleInfo.tsx';
import { RolePermissions } from './RolePermissions.tsx';
import { RolePreview } from './RolePreview.tsx';

export function RoleScreen({ start }: { start: Draft }) {
  const role = useRoleScreen(start);
  const { draft, change, errors } = role;
  return (
    <section class="role-screen" aria-label={role.title}>
      <header class="role-head">
        <nav class="role-crumbs" aria-label={t.crumbs}>
          <button type="button" class="role-back" aria-label={t.backLabel} onClick={role.back}>
            <Icon name="chevron-left" size="small" />
            {t.back}
          </button>
          <Icon name="chevron-right" size="small" />
          <span>{role.crumb}</span>
        </nav>
        <h2 class="role-title">{role.title}</h2>
        <PhoneLight />
        <p class="role-lead">{t.lead}</p>
        <RoleActions role={role} />
      </header>
      <PhoneBar role={role} />
      <Problems errors={errors} notice={role.notice} people={role.people} />
      <div class="role-columns">
        <div class="role-steps">
          <RoleInfo
            draft={draft}
            change={change}
            errors={errors}
            focus={!isPhone()}
            save={role.save}
          />
          <RolePermissions draft={draft} change={change} errors={errors} />
          <RoleHolders role={role} />
        </div>
        <RolePreview draft={draft} />
      </div>
      {role.asking && <Discard role={role} />}
    </section>
  );
}

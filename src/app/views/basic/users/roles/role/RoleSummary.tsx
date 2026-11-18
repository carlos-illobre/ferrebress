// El resumen del rol en el celular, adentro de «Información del rol» (pedido de Carlos): cuántos permisos da y
// cuántas personas lo van a tener, con sus iniciales. Cada pastilla lleva a su paso.
import { type RoleScreenModel, rolesTexts as t } from '../../../../../modules/users/model.ts';
import { showPart } from '../../../../../platform/view/page.ts';
import { privateProps } from '../../../../../platform/view/private.ts';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { Faces } from '../list/RoleRow.tsx';

const goTo = (id: string) => () => showPart(id, { smooth: false, block: 'start' });

export function RoleSummary({ summary }: { summary: RoleScreenModel['summary'] }) {
  return (
    <nav class="role-summary phone-only" aria-label={t.summary}>
      <button type="button" class="roles-stat" onClick={goTo('role-permissions')}>
        <Icon name="key-round" size="small" />
        <b>{summary.permissions.count}</b>
        <span>{summary.permissions.word}</span>
      </button>
      <button type="button" class="roles-stat" onClick={goTo('role-who')} {...privateProps()}>
        {summary.holders.count > 0 ? (
          <Faces faces={summary.holders} />
        ) : (
          <Icon name="users" size="small" />
        )}
        <b>{summary.holders.count}</b>
        <span>{summary.holders.word}</span>
      </button>
    </nav>
  );
}

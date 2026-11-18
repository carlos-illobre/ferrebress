// Una tarjeta de la lista de roles (02 · R7.12): su ícono, nombre, descripción, cuántos permisos da,
// cuántas personas lo tienen y sus iniciales. En el celular, los dos números en grande, cada uno en
// su recuadro, y como mucho dos círculos (pedido de Carlos).
import { type RoleRowLines, rolesTexts as t } from '../../../../../modules/users/model.ts';
import { privateProps } from '../../../../../platform/view/private.ts';
import { Icon } from '../../../ui/icon/Icon.tsx';
import './RoleRow.css';

const tones = 5;

type FaceLines = {
  faces: { id: string; initials: string; index: number }[];
  more: number | undefined;
};

// Las iniciales de quienes lo tienen: con más de las que entran, las primeras y «+N».
export function Faces({ faces }: { faces: FaceLines }) {
  return (
    <span class="roles-faces" aria-hidden="true">
      {faces.faces.map((one) => (
        <span key={one.id} class={`roles-face tone-${one.index % tones}`}>
          {one.initials}
        </span>
      ))}
      {faces.more !== undefined && <span class="roles-face more">+{faces.more}</span>}
    </span>
  );
}

export function RoleRow({
  row,
  arriving,
  first,
  open,
}: {
  row: RoleRowLines;
  arriving: boolean;
  // El primero de la lista: Enter en el buscador lo abre (00 · R2.6).
  first: boolean;
  open: () => void;
}) {
  const { role, holders } = row;
  return (
    <button
      type="button"
      class={arriving ? 'surface roles-row arriving' : 'surface roles-row'}
      aria-label={t.open(role.name)}
      data-mark=""
      data-default={first ? '' : undefined}
      onClick={open}
    >
      <span class="roles-icon">
        <Icon name={role.system ? 'shield-check' : 'users'} />
      </span>
      <span class="roles-main">
        <b>{role.name}</b>
        {role.description && <span>{role.description}</span>}
      </span>
      <span class="roles-stats">
        <span class="roles-stat">
          <Icon name="key-round" size="small" />
          <b>{row.permissions.count}</b>
          <span>{row.permissions.word}</span>
        </span>
        <span class={holders ? 'roles-stat' : 'roles-stat empty'} {...privateProps()}>
          {holders ? (
            <>
              <span class="desktop-only">
                <Faces faces={holders.wide} />
                <span>{holders.text}</span>
              </span>
              <span class="phone-only">
                <Faces faces={holders.narrow} />
                <b>{holders.count}</b>
                <span>{holders.word}</span>
              </span>
            </>
          ) : (
            <>
              <Icon name="users" size="small" />
              <span>{t.nobody}</span>
            </>
          )}
        </span>
      </span>
      <Icon name="chevron-right" />
    </button>
  );
}

// Lo que no se pudo guardar (02 · R7.3, R7.5, E56, E65; maqueta users-roles/final): arriba, en una
// línea, qué hay que corregir; al lado de cada cosa, su motivo. También el aviso de que otra persona
// cambió el rol mientras se armaba (diseño de 02, § 19).
import { privateProps } from '../../../../../platform/view/private.ts';
import { Icon } from '../../../ui/icon/Icon.tsx';

export function Problems({
  problems,
  notice,
}: {
  problems: string | undefined;
  notice: string | undefined;
}) {
  if (notice)
    return (
      <p class="role-notice" role="status">
        <Icon name="info" size="small" />
        {notice}
      </p>
    );
  if (!problems) return null;
  return (
    <p class="role-problems" role="alert" {...privateProps()}>
      <Icon name="triangle-alert" size="small" />
      {problems}
    </p>
  );
}

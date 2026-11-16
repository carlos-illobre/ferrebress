// Los avisos chicos del marco: en la computadora, el globo al costado del menú (el rótulo de un
// ícono o «todavía no está»). En el celular, lo mismo lo dice una tostada.

import { px, texts, useFrame } from '../../../../modules/frame/model.ts';
import { Icon } from '../../ui/icon/Icon.tsx';

export function Tips() {
  const { tip } = useFrame();
  const current = tip.tip;
  if (!current) return null;
  if (current.kind === 'label')
    return (
      <div
        class="tip label"
        aria-hidden="true"
        style={{ left: px(current.left), top: px(current.top) }}
      >
        <b>{current.name}</b>
        {current.detail && ` · ${current.detail}`}
      </div>
    );
  return (
    <div class="tip" role="status" style={{ left: px(current.left), top: px(current.top) }}>
      <Icon name="clock" />
      <span>{texts.notYet(current.name)}</span>
    </div>
  );
}

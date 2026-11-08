// Dónde está una pantalla de Más (maqueta administration-settings/final): en la computadora, «Más ›
// <pantalla>», donde «Más» abre el panel de Más; en el celular, «‹ Más», que vuelve a Más. Fuera del
// marco (una pantalla sola, en sus pruebas) no hay nada.
import { useContext } from 'preact/hooks';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { FrameContext } from '../../context.ts';
import { texts } from '../../texts.ts';
import './MoreCrumb.css';

export function MoreCrumb({ name }: { name: string }) {
  const frame = useContext(FrameContext);
  if (!frame) return null;
  const openMore = () =>
    frame.panels.toggle('more', document.querySelector('.part.more') as Element);
  return (
    <>
      <nav class="more-crumbs desktop-only" aria-label={texts.whereAmI}>
        <button type="button" onClick={openMore}>
          {texts.more}
        </button>
        <Icon name="chevron-right" size="small" />
        <span>{name}</span>
      </nav>
      <button type="button" class="more-back phone-only" onClick={frame.phoneMore.show}>
        <Icon name="chevron-left" size="small" />
        {texts.more}
      </button>
    </>
  );
}

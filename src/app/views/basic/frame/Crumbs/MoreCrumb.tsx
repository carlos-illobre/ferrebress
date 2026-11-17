// Dónde está una pantalla de Más (maqueta administration-settings/final): en la computadora, «Más ›
// <pantalla>», donde «Más» abre el panel de Más; en el celular, «‹ Más», que vuelve a Más. Una pantalla
// que se abre desde otra (Lectores, desde Administración) suma ese paso: «Más › Administración ›
// Lectores», y en el celular «‹ Administración», que vuelve a ella. Fuera del marco (una pantalla
// sola, en sus pruebas) no hay nada.
import { useContext } from 'preact/hooks';
import { texts } from '../../../../modules/frame/model.ts';
import { Icon } from '../../ui/icon/Icon.tsx';
import { FrameContext } from '../context.ts';
import './MoreCrumb.css';

type Parent = { name: string; open: () => void };

export function MoreCrumb({ name, parent }: { name: string; parent?: Parent }) {
  const frame = useContext(FrameContext);
  if (!frame) return null;
  const openMore = () => frame.panels.toggle('more');
  return (
    <>
      <nav class="more-crumbs desktop-only" aria-label={texts.whereAmI}>
        <button type="button" onClick={openMore}>
          {texts.more}
        </button>
        <Icon name="chevron-right" size="small" />
        {parent && (
          <>
            <button type="button" onClick={parent.open}>
              {parent.name}
            </button>
            <Icon name="chevron-right" size="small" />
          </>
        )}
        <span>{name}</span>
      </nav>
      <button
        type="button"
        class="more-back phone-only"
        onClick={parent ? parent.open : frame.phoneMore.show}
      >
        <Icon name="chevron-left" size="small" />
        {parent ? parent.name : texts.more}
      </button>
    </>
  );
}

// El menú de la computadora (00 · R1): el logotipo con el botón de minimizar, las cinco partes y el
// pie con la luz y la persona. Agrandado mide 216 px y minimizado 64, solo con íconos (R1.6).
import isotype from '../../../../styles/brand/isotype.svg';
import logo from '../../../../styles/brand/logo-on-light.webp';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { useFrame } from '../../context.ts';
import { parts, shown } from '../../menu.ts';
import { texts } from '../../texts.ts';
import { MenuItem } from './MenuItem.tsx';
import { More } from './More.tsx';
import { SideFooter } from './SideFooter.tsx';
import './Side.css';
import './SideFooter.css';
import './collapse.css';

export function Side() {
  const { testing } = useFrame();
  return (
    <nav class="side desktop-only" id="side" aria-label={texts.menu}>
      <div class="side-background" aria-hidden="true" />
      <div class="side-line" aria-hidden="true" />
      <div class="side-brand">
        <img class="side-logo" src={logo} alt="Ferrebress" width={141} height={36} />
        <img class="side-isotype" src={isotype} alt="" />
        <CollapseButton />
      </div>
      <ul class="menu">
        {shown(parts, testing).map((option) => (
          <li key={option.id}>
            <MenuItem option={option} />
          </li>
        ))}
        <More />
      </ul>
      <SideFooter />
    </nav>
  );
}

function CollapseButton() {
  const { collapse, panels, tip } = useFrame();
  const name = collapse.collapsed ? texts.expand : texts.collapse;
  return (
    <button
      type="button"
      class="collapse"
      data-mark=""
      data-key="e"
      data-name={name}
      aria-controls="side"
      aria-expanded={!collapse.collapsed}
      aria-label={name}
      onClick={(event) => {
        const button = event.currentTarget;
        panels.close();
        tip.hide();
        collapse.toggle(() => button.matches(':hover, .marked') && tip.label(button));
      }}
      onPointerEnter={(event) => event.pointerType !== 'touch' && tip.label(event.currentTarget)}
      onPointerLeave={tip.hide}
    >
      <Icon name={collapse.collapsed ? 'panel-left-open' : 'panel-left-close'} />
      <kbd>E</kbd>
    </button>
  );
}

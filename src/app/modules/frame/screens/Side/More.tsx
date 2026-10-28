// Más en la computadora: un panel al costado del menú, agrandado o minimizado, porque sus opciones
// con «Pronto» no entran en el menú angosto. → lo abre, ← y Esc lo cierran (es una capa).
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { type Place, px } from '../../behavior/usePanels.ts';
import { useFrame } from '../../context.ts';
import { moreOptions, shown } from '../../menu.ts';
import { texts } from '../../texts.ts';
import { MenuItem } from './MenuItem.tsx';

export function More() {
  const frame = useFrame();
  const options = shown(moreOptions, frame.testing);
  if (options.length === 0) return null;
  const open = frame.panels.open === 'more';
  // Lo que se abre desde el menú siempre sabe dónde: lo calcula al tocar Más.
  const place = frame.panels.place as Place;
  return (
    <li>
      <button
        type="button"
        class="part opens more"
        data-mark=""
        data-key="m"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="more-options"
        onClick={(event) => frame.panels.toggle('more', event.currentTarget)}
      >
        <Icon name="ellipsis" />
        <span class="part-name">{texts.more}</span>
        <kbd>M</kbd>
        <Icon name="chevron-right" size="small" />
      </button>
      {open && (
        <ul
          id="more-options"
          class="more-options side-panel"
          aria-label={texts.more}
          data-layer=""
          data-panel=""
          style={{ left: px(place.left), top: px(place.top) }}
        >
          {options.map((option) => (
            <li key={option.id}>
              <MenuItem option={option} />
            </li>
          ))}
          <li>
            <CloseForKeyboard />
          </li>
        </ul>
      )}
    </li>
  );
}

// Lo que hace Esc en un panel sin botón de cerrar a la vista; el lector de pantalla sí lo ve.
export function CloseForKeyboard() {
  const frame = useFrame();
  return (
    <button type="button" class="visually-hidden" data-close="" onClick={frame.panels.close}>
      {texts.close}
    </button>
  );
}

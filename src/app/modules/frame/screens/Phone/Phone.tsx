// El marco del celular (00 · R1.1): abajo, el menú con las cinco partes; la luz la pone cada pantalla
// debajo de su título. Más es una pantalla entera (PhoneMore); la luz abre una hoja con lo pendiente. Sin
// teclas: en el celular no hay atajos (00 · R2).

import { useContext } from 'preact/hooks';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { FrameContext, useFrame } from '../../context.ts';
import { exists, moreOptions, type Option, openOption, partsFor } from '../../menu.ts';
import { texts } from '../../texts.ts';
import { LightText } from '../Pending/Pending.tsx';
import './Phone.css';

// Debajo del título de cada pantalla del celular: el indicador del vínculo (03 · R4.1) y, solo sin
// conexión, la luz (01 · R6), que abre lo pendiente: mientras todo anda, no ocupa lugar (pedido de
// Carlos). Sin las piezas del vínculo (una pantalla sola, en sus pruebas), la luz siempre. No hay
// cabecera del marco (sin logotipo ni persona): cada pantalla pone esto debajo de su título.
export function PhoneLight() {
  // Fuera del marco (una pantalla sola, en sus pruebas) no hay nada.
  const frame = useContext(FrameContext);
  if (!frame) return null;
  const { link, online, panels } = frame;
  const light = (
    <button
      type="button"
      class="phone-light"
      aria-haspopup="dialog"
      onClick={() => panels.toggle('phonePending')}
    >
      <LightText />
    </button>
  );
  return (
    <div class="phone-status phone-only">
      {link ? <link.Phone light={light} offline={!online} /> : light}
    </div>
  );
}

export function PhoneNav() {
  const { phoneMore, current, person } = useFrame();
  // Más queda elegida también con una de sus opciones abierta.
  const inMore = phoneMore.open || moreOptions.some((option) => option.id === current);
  return (
    <nav class="phone-nav phone-only" aria-label={texts.menu}>
      {partsFor(person).map((option) => (
        <PhonePart key={option.id} option={option} />
      ))}
      <button
        type="button"
        class="phone-part opens"
        aria-current={inMore ? 'page' : undefined}
        onClick={phoneMore.show}
      >
        <span class="phone-part-icon">
          <Icon name="menu" />
        </span>
        <span class="phone-part-name">{texts.more}</span>
        <span class="coming-soon empty" aria-hidden="true">
          ·
        </span>
      </button>
    </nav>
  );
}

function PhonePart({ option }: { option: Option }) {
  const frame = useFrame();
  const soon = !exists(option);
  const current = frame.current === option.id;
  // Con Más a la vista, la parte abierta vuelve a su pantalla.
  const open = (event: MouseEvent) => {
    if (current && frame.phoneMore.open) frame.phoneMore.hide();
    else if (option.path) openOption(option, frame.current);
    else
      frame.notYet(
        (event.currentTarget as HTMLElement).firstElementChild as HTMLElement,
        option.name,
      );
  };
  return (
    <button
      type="button"
      class="phone-part"
      aria-current={current && !frame.phoneMore.open ? 'page' : undefined}
      onClick={open}
    >
      <span class="phone-part-icon">
        <Icon name={option.icon} />
      </span>
      <span class="phone-part-name">{option.name}</span>
      {soon && <span class="coming-soon">{texts.comingSoon}</span>}
    </button>
  );
}

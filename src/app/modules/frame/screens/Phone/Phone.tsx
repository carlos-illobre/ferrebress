// El marco del celular (00 · R1.1): arriba el logotipo, la persona y la luz; abajo, el menú con las
// cinco partes. Más es una pantalla entera (PhoneMore); la luz abre una hoja con lo pendiente. Sin
// teclas: en el celular no hay atajos (00 · R2).
import logo from '../../../../styles/brand/logo-on-light.webp';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { initials, useFrame } from '../../context.ts';
import { exists, type Option, openOption, parts, shown } from '../../menu.ts';
import { texts } from '../../texts.ts';
import { LightText } from '../Pending/Pending.tsx';
import './Phone.css';

export function PhoneTop() {
  const { person, panels, phoneMore } = useFrame();
  return (
    <>
      <header class="phone-top phone-only">
        <img class="phone-logo" src={logo} alt="Ferrebress" width={109} height={28} />
        <button
          type="button"
          class="phone-avatar"
          data-private=""
          aria-label={`${person.name} · ${texts.more}`}
          onClick={phoneMore.show}
        >
          <span class="avatar">{initials(person.name)}</span>
        </button>
      </header>
      <button
        type="button"
        class="phone-light phone-only"
        aria-haspopup="dialog"
        onClick={() => panels.toggle('phonePending')}
      >
        <LightText />
        <Icon name="chevron-right" size="small" />
      </button>
    </>
  );
}

export function PhoneNav() {
  const { testing, phoneMore } = useFrame();
  return (
    <nav class="phone-nav phone-only" aria-label={texts.menu}>
      {shown(parts, testing).map((option) => (
        <PhonePart key={option.id} option={option} />
      ))}
      <button
        type="button"
        class="phone-part opens"
        aria-current={phoneMore.open ? 'page' : undefined}
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

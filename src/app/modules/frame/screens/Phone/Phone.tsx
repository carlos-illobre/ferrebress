// El marco del celular (00 · R1.1): arriba el logotipo, la persona y la luz; abajo, el menú con las
// cinco partes. Más es una hoja con la persona, sus opciones y «Salir» (01 · R5.1); la luz abre
// otra hoja con lo pendiente. Sin teclas: en el celular no hay atajos (00 · R2).
import { navigate } from '../../../../platform/router.ts';
import logo from '../../../../styles/brand/logo-on-light.webp';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { initials, useFrame } from '../../context.ts';
import { exists, type Option, parts, shown } from '../../menu.ts';
import { texts } from '../../texts.ts';
import { LightText } from '../Pending/Pending.tsx';
import './Phone.css';

export function PhoneTop() {
  const { person, panels } = useFrame();
  return (
    <>
      <header class="phone-top phone-only">
        <img class="phone-logo" src={logo} alt="Ferrebress" width={109} height={28} />
        <button
          type="button"
          class="phone-avatar"
          aria-haspopup="dialog"
          aria-label={`${person.name} · ${texts.more}`}
          onClick={() => panels.toggle('phoneMore')}
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
  const { testing, panels } = useFrame();
  const moreOpen = panels.open === 'phoneMore';
  return (
    <nav
      class={moreOpen ? 'phone-nav phone-only more-open' : 'phone-nav phone-only'}
      aria-label={texts.menu}
    >
      {shown(parts, testing).map((option) => (
        <PhonePart key={option.id} option={option} />
      ))}
      <button
        type="button"
        class="phone-part opens"
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        onClick={() => panels.toggle('phoneMore')}
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
  return (
    <button
      type="button"
      class="phone-part"
      aria-current={frame.current === option.id ? 'page' : undefined}
      onClick={(event) =>
        option.path
          ? navigate(option.path)
          : frame.notYet(event.currentTarget.firstElementChild as HTMLElement, option.name)
      }
    >
      <span class="phone-part-icon">
        <Icon name={option.icon} />
      </span>
      <span class="phone-part-name">{option.name}</span>
      {soon && <span class="coming-soon">{texts.comingSoon}</span>}
    </button>
  );
}

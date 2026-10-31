// Más en el celular (maqueta del marco): una pantalla entera con el título, la luz, la persona, las
// opciones en una sola lista, en el orden de la computadora, con su ícono y qué son, y «Salir» aparte
// (00 · R1.2, 01 · R5.1). Lo que todavía no existe dice «Pronto» y no lleva flecha, porque no se abre
// (00 · R1.3). Debajo de Configuración puede ir un interruptor de otro módulo
// (hoy, «Trabajar sin conexión», 15 · R1).
import { Fragment } from 'preact';
import { useWaiting } from '../../../../platform/waiting.ts';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { initials, useFrame } from '../../context.ts';
import { exists, moreOptions, type Option, openOption, unavailable } from '../../menu.ts';
import { texts } from '../../texts.ts';
import { LightText } from '../Pending/Pending.tsx';
import './PhoneMore.css';
import './switch.css';

export function PhoneMore() {
  const { person, panels, phoneMore } = useFrame();
  if (!phoneMore.open) return null;
  return (
    <section class="phone-more phone-only" aria-labelledby="phone-more-title">
      <header class="phone-more-head">
        <h1 class="title" id="phone-more-title">
          {texts.more}
        </h1>
        <button type="button" class="phone-light" onClick={() => panels.toggle('phonePending')}>
          <LightText />
        </button>
      </header>
      <section class="phone-more-card phone-more-person" aria-label={texts.session} data-private="">
        <span class="avatar">{initials(person.name)}</span>
        <div>
          <b>{person.name}</b>
          <small>{person.role}</small>
        </div>
      </section>
      <MoreList />
      <SignOutRow />
    </section>
  );
}

// Las opciones. El interruptor de otro módulo va debajo de Configuración.
function MoreList() {
  return (
    <div>
      <ul class="phone-more-card phone-more-group">
        {moreOptions.map((option) => (
          <Fragment key={option.id}>
            <li>
              <MoreOption option={option} />
            </li>
            {option.id === settingsAfter && <SettingOption />}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}

const settingsAfter = 'deviceSettings';

function MoreOption({ option }: { option: Option }) {
  const { notYet, online, phoneMore } = useFrame();
  const soon = !exists(option);
  const off = unavailable(option, online);
  // Una pantalla de trabajo reemplaza a Más (atrás vuelve a donde se estaba antes de Más); el manual
  // se abre encima.
  const open = () => (option.over ? openOption(option, 'more') : phoneMore.leave(option));
  return (
    <button
      type="button"
      class="phone-more-option"
      disabled={off}
      onClick={(event) => (option.path ? open() : notYet(event.currentTarget, option.name))}
    >
      <span class={option.tone ? `phone-more-icon ${option.tone}` : 'phone-more-icon'}>
        <Icon name={option.icon} />
      </span>
      <span class="phone-more-text">
        <b>{option.name}</b>
        <small>{option.detail}</small>
      </span>
      {soon || off ? (
        <span class="coming-soon">{off ? texts.offlineOption : texts.comingSoon}</span>
      ) : (
        <Icon name="chevron-right" />
      )}
    </button>
  );
}

// El interruptor de otro módulo (hoy, «Trabajar sin conexión»): se toca todo el renglón.
function SettingOption() {
  const { setting } = useFrame();
  if (!setting) return null;
  return (
    <li>
      <button
        type="button"
        class="phone-more-option phone-more-switch"
        role="switch"
        aria-checked={setting.on}
        aria-labelledby="phone-more-switch-name"
        aria-describedby="phone-more-switch-detail"
        onClick={setting.toggle}
      >
        <span class="phone-more-icon neutral">
          <Icon name="wifi-off" />
        </span>
        <span class="phone-more-text">
          <b id="phone-more-switch-name">{setting.name}</b>
          <small id="phone-more-switch-detail">{setting.detail}</small>
        </span>
        <span class="switch" aria-hidden="true" />
      </button>
    </li>
  );
}

function SignOutRow() {
  const { signOut } = useFrame();
  const { busy, run } = useWaiting();
  return (
    <button
      type="button"
      class="phone-more-card phone-more-option phone-more-sign-out"
      aria-busy={busy}
      onClick={() => void run(texts.signingOut, async () => signOut())}
    >
      <span class="phone-more-icon danger">
        <Icon name="log-out" />
      </span>
      <span class="phone-more-text">
        <b>{texts.signOut.short}</b>
        <small>{texts.signOutDetail}</small>
      </span>
      <Icon name="chevron-right" />
    </button>
  );
}

// Más en el celular (maqueta del marco): una pantalla entera con el título, la luz, la persona, las
// opciones en una sola lista, en el orden de la computadora, con su ícono y qué son, y «Salir» aparte
// (00 · R1.2, 01 · R5.1). Lo que todavía no existe dice «Pronto» y no lleva flecha, porque no se abre
// (00 · R1.3).
import { useWaiting } from '../../../../platform/waiting.ts';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { initials, roleNames, useFrame } from '../../context.ts';
import { exists, moreFor, type Option, openOption, unavailable } from '../../menu.ts';
import { texts } from '../../texts.ts';
import { LightText } from '../Pending/Pending.tsx';
import './PhoneMore.css';
import '../../../../ui/switch/switch.css';

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
      <section
        class="surface phone-more-card phone-more-person"
        aria-label={texts.session}
        data-private=""
      >
        <span class="avatar">{initials(person.name)}</span>
        <div>
          <b>{person.name}</b>
          <small>{roleNames(person)}</small>
        </div>
      </section>
      <MoreList />
      <SignOutRow />
    </section>
  );
}

// Las opciones.
function MoreList() {
  const { person } = useFrame();
  return (
    <div>
      <ul class="surface phone-more-card phone-more-group">
        {moreFor(person).map((option) => (
          <li key={option.id}>
            <MoreOption option={option} />
          </li>
        ))}
      </ul>
    </div>
  );
}

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

function SignOutRow() {
  const { signOut } = useFrame();
  const { busy, run } = useWaiting();
  return (
    <button
      type="button"
      class="surface phone-more-card phone-more-option phone-more-sign-out"
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

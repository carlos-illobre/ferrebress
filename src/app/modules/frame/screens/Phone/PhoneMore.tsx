// Más en el celular (maqueta del marco): una pantalla entera con el título, la luz, la persona, las
// opciones en dos grupos con su ícono y qué son, y «Salir» aparte (01 · R5.1). Lo que todavía no
// existe dice «Pronto» y no lleva flecha, porque no se abre (00 · R1.3).
import { navigate } from '../../../../platform/router.ts';
import { useWaiting } from '../../../../platform/waiting.ts';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { initials, useFrame } from '../../context.ts';
import { exists, moreGroups, type Option, shown } from '../../menu.ts';
import { texts } from '../../texts.ts';
import { LightText } from '../Pending/Pending.tsx';
import './PhoneMore.css';

export function PhoneMore() {
  const { person, panels, phoneMore, testing } = useFrame();
  if (!phoneMore.open) return null;
  return (
    <section class="phone-more phone-only" aria-labelledby="phone-more-title">
      <header class="phone-more-head">
        <h1 class="title" id="phone-more-title">
          {texts.more}
        </h1>
        <button
          type="button"
          class="phone-more-light"
          onClick={() => panels.toggle('phonePending')}
        >
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
      {moreGroups.map((group) => {
        const options = shown(group.options, testing);
        return (
          <div key={group.title}>
            <h2 class="phone-more-group-title">{group.title}</h2>
            <ul class="phone-more-card phone-more-group">
              {options.map((option) => (
                <li key={option.id}>
                  <MoreOption option={option} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <SignOutRow />
    </section>
  );
}

function MoreOption({ option }: { option: Option }) {
  const { notYet } = useFrame();
  const soon = !exists(option);
  return (
    <button
      type="button"
      class="phone-more-option"
      onClick={(event) =>
        option.path ? navigate(option.path) : notYet(event.currentTarget, option.name)
      }
    >
      <span class={option.tone ? `phone-more-icon ${option.tone}` : 'phone-more-icon'}>
        <Icon name={option.icon} />
      </span>
      <span class="phone-more-text">
        <b>{option.name}</b>
        <small>{option.detail}</small>
      </span>
      {soon ? <span class="coming-soon">{texts.comingSoon}</span> : <Icon name="chevron-right" />}
    </button>
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

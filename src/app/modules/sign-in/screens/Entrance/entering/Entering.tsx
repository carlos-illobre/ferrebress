// «Entrando» (R2.11): la espera mientras se abre la sesión, desde sus maquetas aprobadas. En el
// celular reemplaza la entrada (la capa «Entrando» de docs/design/mockups/sign-in/adapted/); en la
// computadora reemplaza solo la tarjeta, y la escena no cambia (docs/design/mockups/
// sign-in-entering/final/). Al abrirse la sesión aparece el marco, sin aviso de «Entraste».

import isotype from '../../../../../styles/brand/isotype.svg';
import logo from '../../../../../styles/brand/logo-on-light.webp';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { texts } from '../../../texts.ts';
import type { Way } from '../../../useSignIn.ts';
import { GoogleG } from '../google/GoogleG.tsx';
import './entering.css';
import './entering-card.css';

const t = texts.entering;

const fromIcon = {
  google: <GoogleG />,
  passkey: <Icon name="fingerprint" />,
  phone: <Icon name="smartphone" />,
};

// Un círculo del camino y, en la computadora, su rótulo.
function Stop({
  name,
  what,
  kind,
  children,
}: {
  name: string;
  what: string;
  kind?: string;
  children: preact.ComponentChildren;
}) {
  return (
    <div class="entering-stop">
      <span class={kind ? `entering-ball ${kind}` : 'entering-ball'}>{children}</span>
      <span class="entering-label desktop-only">
        <b>{name}</b>
        <small>{what}</small>
      </span>
    </div>
  );
}

// where: «screen», la pantalla entera del celular; «card», en lugar de la tarjeta de la computadora.
export function Entering({ way, where }: { way: Way; where: 'screen' | 'card' }) {
  const said = t[way];
  return (
    <section
      class={
        where === 'screen'
          ? 'entering entering-screen phone-only'
          : 'entering entering-card desktop-only'
      }
      role="status"
      aria-labelledby={`entering-${where}`}
    >
      {where === 'screen' && <img class="entering-logo" src={logo} alt="Ferrebress" />}
      <h2 id={`entering-${where}`}>{said.title}</h2>
      <p class="entering-detail">{said.detail}</p>
      <div class="entering-path" aria-hidden="true">
        <Stop name={said.from} what={said.fromWhat}>
          {fromIcon[way]}
        </Stop>
        <span class="entering-link">
          <span class="entering-tick">
            <Icon name="check" stroke={3.2} />
          </span>
        </span>
        <Stop name="Ferrebress" what={t.brandWhat} kind="is-brand">
          <span class="entering-ring" />
          <img src={isotype} alt="" />
        </Stop>
        <span class="entering-link todo" />
        <Stop name={t.shop} what={t.shopWhat} kind="is-shop">
          <Icon name="store" stroke={1.8} />
        </Stop>
      </div>
      <ol class="entering-steps">
        <li>
          <span class="entering-mark done">
            <Icon name="check" stroke={3.2} />
          </span>
          <span>
            <b>{said.done}</b>
            <small>{said.doneDetail}</small>
          </span>
        </li>
        <li>
          <span class="entering-mark now" />
          <span>
            <b>{t.opening}</b>
            <small>{t.openingDetail}</small>
          </span>
        </li>
      </ol>
    </section>
  );
}

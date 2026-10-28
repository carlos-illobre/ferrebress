// «Entrando» (R2.11): la espera mientras se abre la sesión, desde sus maquetas aprobadas. En el
// celular reemplaza la entrada (la capa «Entrando» de docs/design/mockups/sign-in/adapted/); en la
// computadora reemplaza solo la tarjeta, y la escena no cambia (docs/design/mockups/
// sign-in-entering/final/). Al abrirse la sesión aparece el marco, sin aviso de «Entraste».

import isotype from '../../../../../styles/brand/isotype.svg';
import logo from '../../../../../styles/brand/logo-on-light.webp';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { texts } from '../../../texts.ts';
import type { Way } from '../../../useSignIn.ts';
import './entering.css';
import './entering-card.css';

const t = texts.entering;

// La G de Google, con sus colores: es la marca de Google, no un ícono del lenguaje.
const GoogleG = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

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

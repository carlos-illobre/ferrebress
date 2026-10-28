// La tarjeta de la entrada (01 · R7.1): en la computadora, el título, el QR de Ferrebress (R2.6),
// Google y la nota; en el celular, Google, la huella y «Escanear». En la computadora, mientras se
// abre la sesión, la espera la tapa (R2.11).
import { isPhone } from '../../../../platform/device/device.ts';
import { useStore } from '../../../../platform/store.ts';
import logo from '../../../../styles/brand/logo-on-light.webp';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { texts } from '../../texts.ts';
import { entering } from '../../useSignIn.ts';
import { FingerButton, ScanButton } from './Buttons.tsx';
import { Entering } from './entering/Entering.tsx';
import { GoogleButton } from './google/GoogleButton.tsx';
import { ClosedNotice, MainNotice } from './Notices.tsx';
import { QrBlock } from './qr/QrBlock.tsx';

export function Card() {
  const way = useStore(entering);
  // Lo de cada dispositivo depende de qué es, no del ancho de la ventana: la computadora siempre
  // muestra el QR y nunca la huella ni «Escanear» (R2.6), aunque la ventana sea angosta.
  const phone = isPhone();
  return (
    <section class="card" aria-label={texts.entrance}>
      {/* Mientras se abre la sesión, lo de la tarjeta sigue debajo de la espera y le da su tamaño. */}
      <div class="card-body" inert={way !== undefined}>
        <div class="card-title desktop-only">
          <h2>{texts.cardTitle}</h2>
          <span class="pill">
            <Icon name="smartphone" size="small" />
            {texts.fastest}
          </span>
        </div>
        <p class="card-sub desktop-only">{texts.cardSub}</p>
        <ClosedNotice />
        {phone ? (
          <>
            <GoogleButton />
            <Or />
            <FingerButton />
            <ScanButton />
          </>
        ) : (
          <>
            <QrBlock />
            <Or />
            <GoogleButton />
          </>
        )}
        <MainNotice />
        <CardEnd />
      </div>
      {way && <Entering way={way} where="card" />}
    </section>
  );
}

const Or = () => (
  <div class="or" aria-hidden="true">
    <span>{texts.or}</span>
  </div>
);

function CardEnd() {
  return (
    <>
      <p class="note desktop-only">
        <Icon name="shield" />
        <span>{texts.note}</span>
      </p>
      <p class="no-password phone-only">
        <Icon name="lock" stroke={1.8} />
        <span>
          <strong>{texts.noPassword}</strong>
          {texts.noPasswordDetail}
        </span>
      </p>
      <p class="card-foot desktop-only">
        <span>
          <Icon name="lock" />
          {texts.protectedData}
        </span>
        <span class="bar" aria-hidden="true" />
        <img src={logo} alt="Ferrebress" />
      </p>
    </>
  );
}

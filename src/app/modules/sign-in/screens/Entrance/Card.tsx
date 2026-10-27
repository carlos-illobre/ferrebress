// La tarjeta de la entrada (01 · R7.1): en la computadora, el título, el QR de Ferrebress (R2.6),
// Google y la nota; en el celular, Google, la huella y «Escanear».
import { isPhone } from '../../../../platform/device.ts';
import logo from '../../../../styles/brand/logo-on-light.webp';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { texts } from '../../texts.ts';
import { FingerButton, GoogleButton, ScanButton } from './Buttons.tsx';
import { ClosedNotice, MainNotice } from './Notices.tsx';
import { QrBlock } from './QrBlock.tsx';

export function Card() {
  return (
    <section class="card" aria-label={texts.entrance}>
      <div class="card-title desktop-only">
        <h2>{texts.cardTitle}</h2>
        <span class="pill">
          <Icon name="smartphone" size="small" />
          {texts.fastest}
        </span>
      </div>
      <p class="card-sub desktop-only">{texts.cardSub}</p>
      <ClosedNotice />
      {!isPhone() && <QrBlock />}
      <Or where="desktop-only" />
      <GoogleButton />
      <Or where="phone-only" />
      <FingerButton />
      <ScanButton />
      <MainNotice />
      <CardEnd />
    </section>
  );
}

const Or = ({ where }: { where: string }) => (
  <div class={`or ${where}`} aria-hidden="true">
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

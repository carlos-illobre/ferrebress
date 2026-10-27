// La tarjeta de la entrada (01 · R7.1): en la computadora, el título, el QR o el celular cercano,
// Google y la nota; en el celular, Google, la huella y «Escanear».
import { useEffect, useState } from 'preact/hooks';
import { canUseNearbyPhone, isPhone } from '../../../../platform/device.ts';
import logo from '../../../../styles/brand/logo-on-light.webp';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { texts } from '../../texts.ts';
import { FingerButton, GoogleButton, ScanButton } from './Buttons.tsx';
import { NearbyBlock } from './NearbyBlock.tsx';
import { ClosedNotice, MainNotice } from './Notices.tsx';
import { QrBlock } from './QrBlock.tsx';

// En la computadora: el celular cercano si el navegador puede (R2.6), si no el QR propio. Mientras
// se pregunta, ninguno, para no abrir el canal de un QR que no se va a usar.
function useNearby(): boolean | undefined {
  const [nearby, setNearby] = useState<boolean>();
  useEffect(() => {
    if (!isPhone()) void canUseNearbyPhone().then(setNearby);
  }, []);
  return nearby;
}

export function Card() {
  const nearby = useNearby();
  return (
    <section class="card" aria-label={texts.entrance}>
      <div class={nearby ? 'card-title desktop-only nearby' : 'card-title desktop-only'}>
        <h2>{texts.cardTitle}</h2>
        <span class="pill">
          <Icon name="smartphone" size="small" />
          {texts.fastest}
        </span>
      </div>
      <p class="card-sub desktop-only">{texts.cardSub}</p>
      <ClosedNotice />
      {nearby === false && <QrBlock />}
      {nearby && <NearbyBlock />}
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

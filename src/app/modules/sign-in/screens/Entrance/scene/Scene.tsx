// Lo que rodea a la tarjeta en la entrada (01 · R7.1): la marca, lo que hace Ferrebress y «Ver el
// manual»; el celular
// de muestra, el estado de la conexión y los sellos en la computadora; el lema, para qué sirve y
// la ola en el celular.

import logoDark from '../../../../../styles/brand/logo-on-dark-large.webp';
import logoLight from '../../../../../styles/brand/logo-on-light-large.webp';
import type { IconName } from '../../../../../ui/icon/Icon.tsx';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { showToast } from '../../../../../ui/toast/Toast.tsx';
import { texts } from '../../../texts.ts';
import { useEntrance } from '../context.ts';
import phone from './phone-selling.webp';

const pointIcons: IconName[] = ['shopping-cart', 'file-text', 'package'];
const sealIcons: IconName[] = ['wifi-off', 'scan-barcode', 'monitor-smartphone'];
const whatForIcons: IconName[] = ['shopping-cart', 'package', 'chart-column'];

const Lines = ({ lines }: { lines: readonly string[] }) => (
  <>
    {lines.map((line, index) => (
      <span key={line}>
        {index > 0 && <br />}
        {line}
      </span>
    ))}
  </>
);

// `phone`: en el celular, la entrada es oscura y lleva el logo blanco, como la computadora.
export function Brand({ phone }: { phone: boolean }) {
  return (
    <section class="brand">
      <h1 class="brand-logo">
        <img class="desktop-only" src={logoDark} alt="Ferrebress" width={593} height={152} />
        {phone ? (
          <img class="phone-only" src={logoDark} alt="Ferrebress" width={593} height={152} />
        ) : (
          <img class="phone-only" src={logoLight} alt="Ferrebress" width={492} height={126} />
        )}
      </h1>
      <p class="brand-motto phone-only">{texts.motto}</p>
      <p class="brand-kicker desktop-only">{texts.kicker}</p>
      <p class="brand-title desktop-only">
        {texts.title[0]}
        <br />
        {texts.title[1]}
        <br />
        <em>{texts.title[2]}</em>
      </p>
      <p class="brand-lead desktop-only">{texts.lead}</p>
      <ul class="brand-points desktop-only">
        {texts.points.map((lines, index) => (
          <li key={lines[0]}>
            <span>
              <Icon name={pointIcons[index] as IconName} />
            </span>
            <span>
              <Lines lines={lines} />
            </span>
          </li>
        ))}
      </ul>
      <ManualButton />
    </section>
  );
}

// «Ver el manual», en la computadora (R7.2, E39): mientras el manual no exista, dice que todavía no
// está. En el celular el manual se abre desde Más.
const ManualButton = () => (
  <button
    type="button"
    class="manual desktop-only"
    data-mark=""
    data-key="m"
    onClick={() => showToast(texts.manualSoon)}
  >
    <Icon name="book-open" />
    {texts.manual}
    <span class="manual-soon">{texts.soon}</span>
    <kbd>M</kbd>
  </button>
);

export const PhoneShot = () => (
  <img class="phone-shot desktop-only" src={phone} alt="" aria-hidden="true" />
);

export function Status() {
  const { online } = useEntrance();
  return (
    <p class="status">
      <span class="status-device desktop-only">
        <Icon name="monitor" size="small" />
        {texts.device}
      </span>
      <span class="status-net" role="status">
        {online ? texts.online : texts.offline}
      </span>
    </p>
  );
}

export function Seals() {
  return (
    <ul class="seals desktop-only">
      {texts.seals.map((lines, index) => (
        <li key={lines[0]}>
          <Icon name={sealIcons[index] as IconName} stroke={1.7} />
          <span>
            <Lines lines={lines} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function WhatFor() {
  return (
    <ul class="what-for phone-only">
      {texts.whatFor.map(([title, detail], index) => (
        <li key={title}>
          <span class="round">
            <Icon name={whatForIcons[index] as IconName} />
          </span>
          <strong>{title}</strong>
          <span>{detail}</span>
        </li>
      ))}
    </ul>
  );
}

export const Wave = () => (
  <footer class="wave phone-only" aria-hidden="true">
    <svg viewBox="0 0 390 150" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 4 C 110 46, 250 84, 390 92 L 390 150 L 0 150 Z" fill="#d83f0e" />
      <path d="M0 26 C 110 62, 250 90, 390 96 L 390 150 L 0 150 Z" fill="#17312b" />
    </svg>
  </footer>
);

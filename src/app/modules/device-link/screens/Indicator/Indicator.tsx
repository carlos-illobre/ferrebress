// El indicador del vínculo (R4.1), siempre a la vista: en la computadora, un renglón al pie del
// lateral, con el punto del estado y con qué está vinculado (Alt L abre el detalle); en el celular,
// una pastilla a la derecha del título de la pantalla. Los dos, del mismo estado y con los mismos
// textos (decisión de 00: uno largo, otro corto).

import type { Side } from '@ferrebress/shared/contracts/pairing';
import type { ComponentChildren } from 'preact';
import { useStore } from '../../../../platform/store.ts';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { Say, type Words } from '../../../../ui/say/Say.tsx';
import { detailOpen } from '../../detail.ts';
import { texts } from '../../texts.ts';
import { useLinkView } from '../../use-link.ts';
import type { LinkView } from '../../view.ts';
import './Indicator.css';

export function labelOf(view: LinkView): Words {
  if (view.status !== 'waiting') return texts.label[view.status];
  // Esperando hay siempre un vínculo, y de qué lado es.
  return texts.waitingFor[view.side as Side];
}

type WithLight = { light: ComponentChildren; offline: boolean };

// En la computadora: al pie del lateral, una sola tarjeta con el vínculo y, debajo, la luz de
// conexión, que dice siempre si ya se envió todo (pedido de Carlos); sin nada que mostrar del
// vínculo, la luz sola.
export function SideIndicator({ light, offline }: WithLight) {
  const view = useLinkView();
  if (view.hidden) return <>{light}</>;
  return (
    <div class="link-box" data-offline={offline || undefined}>
      <SideButton view={view} />
      {light}
    </div>
  );
}

function SideButton({ view }: { view: LinkView }) {
  const open = useStore(detailOpen);
  const label = labelOf(view);
  const detail = view.status === 'unpaired' ? texts.tapToPair : view.other;
  return (
    <button
      type="button"
      class="link-indicator"
      data-tone={view.tone}
      data-mark=""
      data-key="l"
      data-name={label.long}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="link-detail"
      aria-label={texts.open(label.long, view.other)}
      onClick={() => detailOpen.set(!open)}
    >
      <span class="link-indicator-icon">
        <Icon name="smartphone" />
        <span class="link-dot" />
      </span>
      <span class="link-indicator-text">
        <b>{label.long}</b>
        <small>{detail}</small>
      </span>
      <kbd>L</kbd>
    </button>
  );
}

// En el celular: la pastilla debajo del título, con la luz de conexión al lado cuando no está todo en
// línea; sin nada que mostrar del vínculo, la luz en su lugar (00 · R4.1). La luz la da el marco.
export function PhoneIndicator({ light, offline }: WithLight) {
  const view = useLinkView();
  const open = useStore(detailOpen);
  if (view.hidden) return <>{light}</>;
  const label = labelOf(view);
  return (
    <>
      <button
        type="button"
        class="link-pill"
        data-tone={view.tone}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="link-detail"
        aria-label={texts.open(label.long, view.other)}
        onClick={() => detailOpen.set(!open)}
      >
        <Icon name="monitor" size="small" />
        <span class="link-dot" />
        <span class="link-pill-text">
          <Say words={label} />
        </span>
      </button>
      {offline && light}
    </>
  );
}

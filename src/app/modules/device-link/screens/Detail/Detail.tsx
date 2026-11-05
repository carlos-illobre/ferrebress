// El detalle del vínculo (R4.2): flota al lado del lateral en la computadora y es una hoja en el
// celular. La ruta, la frase del estado (o «No se pudo», que la reemplaza), la tira del día, los
// datos y los botones. Es una capa del teclado: Alt C o Esc lo cierran (00 · R2.7, R2.10).

import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { useNarrow } from '../../../../platform/narrow.ts';
import { serverNow } from '../../../../platform/server/clock.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { Sheet } from '../../../../ui/sheet/Sheet.tsx';
import { type LinkView, onPhone } from '../../view.ts';
import { Code } from '../Code/Code.tsx';
import { labelOf } from '../Indicator/Indicator.tsx';
import { type Act, Actions } from './Actions.tsx';
import { Facts } from './Facts.tsx';
import { Route } from './Route.tsx';
import { Today } from './Today.tsx';
import { detailTexts } from './texts.ts';
import './Detail.css';
import './Today.css';
import './Actions.css';

// El código para vincular, si está a la vista (solo en la computadora).
type CodePage = { onBack: () => void; onPaired: (pairing: PairingView) => void };
type Props = {
  view: LinkView;
  onAct: (act: Act) => unknown;
  onClose: () => void;
  code?: CodePage | undefined;
};

const titleOf = (view: LinkView, phone: boolean) => {
  const t = detailTexts.detail.title;
  if (view.status === 'unpaired') return phone ? t.unpairedComputer.short : t.unpairedComputer.long;
  return phone ? t.computer.short : t.computer.long;
};

function Phrase({ view }: { view: LinkView }) {
  const over = view.status === 'direct' || view.status === 'relayed';
  return (
    <div class="link-phrase">
      <span class="link-state" data-tone={view.tone}>
        <span class="link-dot" />
        <Say words={labelOf(view)} />
        {over && (
          <span class="long">{detailTexts.detail.over[view.status as 'direct' | 'relayed']}</span>
        )}
      </span>
      {view.probe === 'failed' ? (
        <p class="link-failed" role="status">
          <Say words={detailTexts.detail.probeFailed} />
        </p>
      ) : (
        <p>
          <Say words={detailTexts.detail.phrase[view.status]} />
        </p>
      )}
    </div>
  );
}

function Body({ view, onAct, phone }: Omit<Props, 'onClose'> & { phone: boolean }) {
  const now = serverNow()?.getTime() ?? Date.now();
  return (
    <>
      <Route view={view} phone={phone} />
      <Phrase view={view} />
      {view.status === 'unpaired' && !phone && (
        <ol class="link-steps">
          {detailTexts.detail.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {view.pairing && <Today />}
      {view.pairing && <Facts pairing={view.pairing} now={now} />}
      <Actions view={view} phone={phone} onAct={onAct} />
    </>
  );
}

export function Detail({ view, onAct, onClose, code }: Props) {
  const narrow = useNarrow();
  const phone = onPhone(view);
  const title = titleOf(view, phone);
  if (narrow)
    return (
      <Sheet title={title} onClose={onClose} className="link-sheet">
        <h2 class="link-title">{title}</h2>
        <Body view={view} onAct={onAct} phone={phone} />
      </Sheet>
    );
  return (
    <section class="link-detail" id="link-detail" role="dialog" aria-label={title} data-layer="">
      {code ? (
        <Code other={view.other} onBack={code.onBack} onPaired={code.onPaired} />
      ) : (
        <Page view={view} onAct={onAct} onClose={onClose} title={title} />
      )}
    </section>
  );
}

function Page({ view, onAct, onClose, title }: Omit<Props, 'code'> & { title: string }) {
  return (
    <>
      <div class="link-head">
        <h2 class="link-title">{title}</h2>
        <Button
          look="plain"
          size="small"
          icon="x"
          shortcut="c"
          closes
          doing={detailTexts.detail.close}
          onPress={onClose}
        >
          <span class="visually-hidden">{detailTexts.detail.close}</span>
        </Button>
      </div>
      <Body view={view} onAct={onAct} phone={onPhone(view)} />
    </>
  );
}

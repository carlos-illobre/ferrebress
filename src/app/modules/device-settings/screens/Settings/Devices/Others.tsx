// Tus otros dispositivos (04 · R1.8, R6 a R8, R10): las cuentas, «Cerrar todas» con confirmación, el
// recibo de lo cortado y una tarjeta por dispositivo. Sin conexión, lo último que se vio, gris, con
// «Reintentar»: no se pide solo al volver la conexión (R10.1).
import type { MyDevicesResponse } from '@ferrebress/shared/contracts/device-settings';
import { useState } from 'preact/hooks';
import { isPhone } from '../../../../../platform/device/device.ts';
import { Button } from '../../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { LoadState } from '../../../../../ui/load-state/LoadState.tsx';
import { Offline } from '../../../../../ui/offline/Offline.tsx';
import { countsOf, type Receipt } from '../../../mine/rules.ts';
import { mineTexts as t } from '../../../mine/texts.ts';
import type { Mine } from '../../../mine/useMine.ts';
import { Family } from './Family.tsx';

function CloseAll({ n, mine, close }: { n: number; mine: Mine; close: () => void }) {
  return (
    <Dialog label={t.closeAllTitle(n)} className="mine-dialog">
      <h2>{t.closeAllTitle(n)}</h2>
      <p>{t.closeAllLead(t.here(isPhone()))}</p>
      <div class="mine-dialog-foot">
        <Button look="plain" doing={t.cancel} onPress={close} closes>
          {t.cancel}
        </Button>
        <Button
          look="red"
          icon="log-out"
          doing={t.closeThem(n)}
          onPress={async () => {
            close();
            await mine.closeAll();
          }}
          primary
        >
          {t.closeThem(n)}
        </Button>
      </div>
    </Dialog>
  );
}

function Counts({ data, mine }: { data: MyDevicesResponse; mine: Mine }) {
  // local: «Cerrar todas» cierra las de esta persona desde este dispositivo, no se espeja.
  const [asking, setAsking] = useState(false);
  const counts = countsOf(data);
  return (
    <div class="mine-counts">
      <div class="surface mine-count-tile">
        <Icon name="monitor-smartphone" />
        <span>{t.sessions}</span>
        <b>{counts.sessions}</b>
      </div>
      <div class="surface mine-count-tile">
        <Icon name="fingerprint" />
        <span>{t.withPasskey}</span>
        <b>{counts.passkeys}</b>
      </div>
      {counts.sessions > 1 && (
        <Button icon="log-out" shortcut="x" doing={t.closeAll} onPress={() => setAsking(true)}>
          {t.closeAll}
        </Button>
      )}
      {asking && <CloseAll n={counts.sessions} mine={mine} close={() => setAsking(false)} />}
    </div>
  );
}

function ReceiptCard({ receipt, done }: { receipt: Receipt; done: () => void }) {
  return (
    <div class="mine-receipt" role="status">
      <div class="mine-receipt-head">
        <span class="mine-receipt-icon">
          <Icon name="scissors" />
        </span>
        <div>
          <b>{receipt.title}</b>
          <span>{t.receipt.nobody}</span>
        </div>
        <button type="button" class="button button-plain button-small" data-mark="" onClick={done}>
          {t.receipt.done}
        </button>
      </div>
      <ul>
        {(receipt.cuts.length > 0 ? receipt.cuts : [t.receipt.nothing]).map((cut) => (
          <li key={cut}>
            <Icon name="check" size="small" />
            {cut}
          </li>
        ))}
      </ul>
    </div>
  );
}

function List({ data, mine }: { data: MyDevicesResponse; mine: Mine }) {
  return (
    <>
      <Counts data={data} mine={mine} />
      {mine.receipts.map((receipt) => (
        <ReceiptCard key={receipt.key} receipt={receipt} done={() => mine.dismiss(receipt.key)} />
      ))}
      {data.others.length > 0 ? (
        data.others.map((device) => <Family key={device.key} device={device} mine={mine} />)
      ) : (
        <p class="mine-empty">
          <Icon name="check" />
          {t.empty(data.here.isPhone)}
        </p>
      )}
    </>
  );
}

export function Others({ mine }: { mine: Mine }) {
  const { state } = mine;
  const texts = { loading: t.loading, loadFailed: t.failed, retry: t.retry };
  return (
    <section class="mine-others" aria-labelledby="mine-others">
      <h2 class="settings-group" id="mine-others">
        {t.others}
      </h2>
      {state.status === 'offline' && (
        <div class="mine-offline">
          <Offline look="mine-offline-notice" text={t.offline} />
          <Button size="small" icon="refresh-cw" doing={t.retry} onPress={mine.reload}>
            {t.retry}
          </Button>
        </div>
      )}
      {'data' in state && state.data ? (
        <div class={state.status === 'offline' ? 'mine-server is-offline' : 'mine-server'}>
          <List data={state.data} mine={mine} />
        </div>
      ) : (
        state.status !== 'offline' && (
          <LoadState
            look="mine-load"
            failed={state.status === 'failed'}
            texts={texts}
            retry={mine.reload}
          />
        )
      )}
    </section>
  );
}

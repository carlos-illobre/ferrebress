// Este dispositivo (04 · R1.8, R6, R9; maqueta device-settings-b/final): el dibujo del aparato con su
// nombre, «Ponele nombre», su huella en el celular con las computadoras que hizo entrar, y las
// preferencias de la etapa a, que se mudan adentro sin cambiar (`children`).
import type { MyDevicesResponse } from '@ferrebress/shared/contracts/device-settings';
import type { ComponentChildren } from 'preact';
import type { DeviceSettings, NameModel } from '../../../../../modules/device-settings/model.ts';
import { lastUseOf, mineTexts as t } from '../../../../../modules/device-settings/model.ts';
import { isPhone as onPhone } from '../../../../../platform/view/device.ts';
import { useLoaded } from '../../../../../platform/view/lazy.ts';
import { dayMonthOf, nowMs } from '../../../../../platform/view/time.ts';
import { Button } from '../../../../../ui/button/Button.tsx';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { loadConfirmSheet } from '../../../sign-in/index.ts';
import { Computers } from './Family.tsx';
import { Name } from './Name.tsx';

type Here = MyDevicesResponse['here'];

function Drawing({ here, name }: { here: Here; name: NameModel }) {
  const shown = name.shown;
  return (
    <div
      class={`mine-device ${here.isPhone ? 'is-phone' : 'is-computer'}${name.shines ? ' shines' : ''}`}
    >
      <div class="mine-screen">
        <span class={shown ? 'mine-device-name' : 'mine-device-name unnamed'}>
          {shown || t.noName}
        </span>
        <span class="mine-device-label">{here.deviceLabel}</span>
      </div>
      {!here.isPhone && <span class="mine-stand" />}
    </div>
  );
}

// La hoja de volver a confirmar quién es, que se baja recién ahora (02 · R3.8).
function Confirm({ done, close }: { done: () => unknown; close: () => void }) {
  const sheet = useLoaded(loadConfirmSheet);
  return sheet ? (
    <sheet.ConfirmSheet onConfirmed={done} onClose={close} what={[...t.passkey.confirmWhat]} />
  ) : null;
}

function Passkey({ model, disabled }: { model: DeviceSettings; disabled: boolean }) {
  const { mine, linking } = model;
  const here = model.here as Here;
  const now = nowMs();
  if (here.passkey === 'other')
    return (
      <p class="mine-passkey-note">
        <Icon name="fingerprint" />
        {t.passkey.other}
      </p>
    );
  if (here.passkey === 'none')
    return (
      <>
        <Button
          look="dark"
          icon="fingerprint"
          doing={t.passkey.link}
          onPress={linking.ask}
          disabled={disabled}
        >
          {t.passkey.link}
        </Button>
        {linking.confirming && <Confirm done={linking.confirmed} close={linking.close} />}
      </>
    );
  const since = here.since as NonNullable<Here['since']>;
  return (
    <div class="mine-passkey">
      <Icon name="fingerprint" />
      <span class="mine-passkey-text">
        <span>{t.passkey.since(dayMonthOf(since.createdAt, now))}</span>
        <small>{lastUseOf(since.lastUsedAt, now)}</small>
      </span>
      <Button
        look="plain"
        size="small"
        doing={t.passkey.remove}
        onPress={mine.removeHere}
        disabled={disabled}
      >
        {t.passkey.remove}
      </Button>
    </div>
  );
}

function FromServer({ model, disabled }: { model: DeviceSettings; disabled: boolean }) {
  const here = model.here as Here;
  return (
    <div class={disabled ? 'mine-server is-offline' : 'mine-server'}>
      <div class="mine-here-top">
        <Drawing here={here} name={model.name} />
        <div class="mine-name">
          <Name isPhone={here.isPhone} name={model.name} disabled={disabled} />
        </div>
      </div>
      {here.isPhone && <Passkey model={model} disabled={disabled} />}
      <Computers computers={here.computers} here mine={model.mine} />
    </div>
  );
}

export function HereCard({
  model,
  children,
}: {
  model: DeviceSettings;
  children: ComponentChildren;
}) {
  const { state } = model.mine;
  const here = model.here;
  return (
    <article class="surface mine-here" aria-label={t.here(here?.isPhone ?? onPhone())}>
      <header class="mine-here-head">
        <span class="mine-label">{t.here(here?.isPhone ?? onPhone())}</span>
        <span class="mine-using">
          <span class="mine-dot" />
          {t.using}
        </span>
      </header>
      {here && <FromServer model={model} disabled={state.status === 'offline'} />}
      <div class="mine-prefs">
        <h3 class="mine-sub">{t.howYouUse}</h3>
        {children}
      </div>
    </article>
  );
}

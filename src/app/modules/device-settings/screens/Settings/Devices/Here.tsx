// Este dispositivo (04 · R1.8, R6, R9; maqueta device-settings-b/final): el dibujo del aparato con su
// nombre, «Ponele nombre», su huella en el celular con las computadoras que hizo entrar, y las
// preferencias de la etapa a, que se mudan adentro sin cambiar (`children`).
import type { MyDevicesResponse } from '@ferrebress/shared/contracts/device-settings';
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { isPhone as onPhone } from '../../../../../platform/device/device.ts';
import { useLoaded } from '../../../../../platform/lazy.ts';
import { useStore } from '../../../../../platform/store.ts';
import { dateOf, nowMs, sinceOf } from '../../../../../platform/time.ts';
import { Button } from '../../../../../ui/button/Button.tsx';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { loadConfirmSheet, person } from '../../../../sign-in/index.ts';
import { lastUseOf } from '../../../mine/rules.ts';
import { mineTexts as t } from '../../../mine/texts.ts';
import type { Mine } from '../../../mine/useMine.ts';
import { Computers } from './Family.tsx';
import { type Draft, Name } from './Name.tsx';

type Here = MyDevicesResponse['here'];

function Drawing({ here, draft, shines }: { here: Here; draft: Draft; shines: boolean }) {
  const shown = draft ? draft.text.trim() : here.name;
  return (
    <div
      class={`mine-device ${here.isPhone ? 'is-phone' : 'is-computer'}${shines ? ' shines' : ''}`}
    >
      <div class="mine-screen">
        <span class={shown ? 'mine-device-name' : 'mine-device-name unnamed'}>
          {shown || t.noName}
        </span>
        <span class="mine-device-label">{here.label}</span>
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

function Passkey({ here, mine, disabled }: { here: Here; mine: Mine; disabled: boolean }) {
  // local: vincular la huella es de este celular.
  const [confirming, setConfirming] = useState(false);
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
          onPress={() => setConfirming(true)}
          disabled={disabled}
        >
          {t.passkey.link}
        </Button>
        {confirming && <Confirm done={mine.link} close={() => setConfirming(false)} />}
      </>
    );
  const since = here.since as NonNullable<Here['since']>;
  return (
    <div class="mine-passkey">
      <Icon name="fingerprint" />
      <span class="mine-passkey-text">
        <span>{t.passkey.since(dateOf(since.createdAt, now))}</span>
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

function FromServer({ here, mine, disabled }: { here: Here; mine: Mine; disabled: boolean }) {
  // local: el nombre es de este dispositivo; el otro, en espejo, muestra el suyo (R1.6).
  const [draft, setDraft] = useState<Draft>(undefined);
  // local: el brillo al guardar, en el dispositivo que guardó.
  const [shines, setShines] = useState(false);
  const who = useStore(person);
  const ideas = t.name.ideas(here.isPhone, who?.name.split(' ')[0] ?? '');
  const names = mine.state.status === 'ready' ? mine.state.data.names : [];
  const save = async (name: string) => {
    const saved = await mine.rename(name);
    if (!saved) return;
    setDraft(undefined);
    setShines(true);
    setTimeout(() => setShines(false), 900);
  };
  return (
    <div class={disabled ? 'mine-server is-offline' : 'mine-server'}>
      <div class="mine-here-top">
        <Drawing here={here} draft={draft} shines={shines} />
        <div class="mine-name">
          <Name
            {...{
              isPhone: here.isPhone,
              name: here.name,
              names,
              ideas,
              draft,
              setDraft,
              save,
              disabled,
            }}
          />
        </div>
      </div>
      {here.isPhone && <Passkey here={here} mine={mine} disabled={disabled} />}
      <Computers computers={here.computers} here mine={mine} />
    </div>
  );
}

export function HereCard({ mine, children }: { mine: Mine; children: ComponentChildren }) {
  const { state } = mine;
  const here = 'data' in state ? state.data?.here : undefined;
  return (
    <article class="surface mine-here" aria-label={t.here(here?.isPhone ?? onPhone())}>
      <header class="mine-here-head">
        <span class="mine-label">{t.here(here?.isPhone ?? onPhone())}</span>
        <span class="mine-using">
          <span class="mine-dot" />
          {t.using}
        </span>
      </header>
      {here && <FromServer here={here} mine={mine} disabled={state.status === 'offline'} />}
      <div class="mine-prefs">
        <h3 class="mine-sub">{t.howYouUse}</h3>
        {children}
      </div>
    </article>
  );
}

// Las hojas del celular cuando lee el código de una computadora (R2.5, R2.7; E13 a E16c): qué
// computadora pide entrar, con el botón que abre directo el lector del celular, o que hay que estar
// en el mismo Wi-Fi. Con demasiados intentos o una cuenta que no puede entrar, lo mismo que la
// entrada (E03, R2.9). Que la computadora entró no se avisa: se ve en ella (R2.11).
import type { Person, ReadCodeResponse } from '@ferrebress/shared/contracts/sign-in';
import { Sheet } from '../../../../ui/sheet/Sheet.tsx';
import type { usePhoneCode } from '../../codes/usePhoneCode.ts';
import { minutes, type Notice, useNotice } from '../../notice.ts';
import { person } from '../../session.ts';
import { texts } from '../../texts.ts';
import { SheetButton, SheetIcon } from './pieces.tsx';

type Code = ReturnType<typeof usePhoneCode>;

export function CodeSheet({ code }: { code: Code }) {
  const { state } = code;
  if (state.step === 'none' || state.step === 'sign-in-first') return null;
  return (
    <Sheet title={texts.entrance} onClose={state.step === 'ask' ? code.notMe : code.close}>
      {state.step === 'ask' ? <Ask code={code} read={state.read} /> : <Result code={code} />}
    </Sheet>
  );
}

function Ask({ code, read }: { code: Code; read: ReadCodeResponse }) {
  const linking = read.registration !== undefined;
  return (
    <>
      <SheetIcon
        name={linking ? 'fingerprint' : 'monitor'}
        {...(!linking && { look: 'computer' })}
      />
      <h2>{linking ? texts.code.linkTitle : texts.code.ask(read.computer.label)}</h2>
      <p class="sheet-sub" data-private="">
        {linking ? texts.code.linkDetail((person.get() as Person).email) : texts.code.askDetail}
      </p>
      <SheetButton look="orange" doing={texts.signingIn} onPress={code.touch}>
        {texts.code.go}
      </SheetButton>
      <SheetButton look="plain" doing={texts.cancel} onPress={code.notMe} closes>
        {texts.code.notMe}
      </SheetButton>
    </>
  );
}

// La cuenta regresiva sigue en la hoja, como en la entrada; al llegar a cero, queda en 0:00.
function Refused({ initial }: { initial: Notice }) {
  const { notice } = useNotice(initial);
  if (initial.kind === 'not-authorized')
    return <h2 data-private="">{texts.notAuthorized(initial.email)}</h2>;
  const seconds = notice?.kind === 'too-many' ? notice.seconds : 0;
  return (
    <>
      <h2>{texts.tooMany}</h2>
      <p class="sheet-sub">
        {texts.tryAgainIn} <b>{minutes(seconds)}</b>.
      </p>
    </>
  );
}

function Result({ code }: { code: Code }) {
  const { state } = code;
  if (state.step === 'refused')
    return (
      <>
        <SheetIcon name={state.notice.kind === 'too-many' ? 'clock' : 'ban'} />
        <Refused initial={state.notice} />
        <SheetButton look="green" doing={texts.cancel} onPress={code.close} closes>
          {texts.code.ok}
        </SheetButton>
      </>
    );
  const text =
    state.step === 'other-network'
      ? texts.code.otherNetwork
      : state.step === 'no-passkey'
        ? texts.code.noPasskey
        : texts.code.expired;
  return (
    <>
      <SheetIcon name={state.step === 'other-network' ? 'wifi' : 'triangle-alert'} />
      <h2>{text}</h2>
      <SheetButton look="green" doing={texts.cancel} onPress={code.close} closes>
        {texts.code.ok}
      </SheetButton>
    </>
  );
}

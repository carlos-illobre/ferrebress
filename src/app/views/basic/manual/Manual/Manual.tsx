// El manual (00 · R6, maqueta final aprobada): en la computadora, la barra de arriba con el
// dispositivo y «Volver», las tareas a la izquierda y el paso a paso a la derecha; en el celular, las
// tareas a pantalla entera con «‹ Más» y el paso a paso en una hoja. Es una capa del teclado que
// recorre pasos (data-arrows). No lee la sesión ni pide nada a /api (R6.2, E53). En el ambiente de
// pruebas lleva el marco y el cartel, como toda pantalla (R10.1).
import type { Device } from '@ferrebress/shared/contracts/manual';
import { TestEnvironment } from '../../../../modules/frame/index.ts';
import type { Back, View } from '../../../../modules/manual/model.ts';
import { type ManualScreen, texts, useManualScreen } from '../../../../modules/manual/model.ts';
import { useNarrow } from '../../../../platform/view/narrow.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import logo from '../../../../styles/brand/logo-on-light.webp';
import { AllSteps } from '../AllSteps/AllSteps.tsx';
import { Glyph } from '../Glyph/Glyph.tsx';
import { Guide, GuideOffline } from '../Guide/Guide.tsx';
import { NeedsInternet } from '../place/NeedsInternet.tsx';
import { Tasks } from '../Tasks/Tasks.tsx';
import './Manual.css';

function Devices({ view, keys }: { view: View; keys: boolean }) {
  const hints = useShortcutHints('manual');
  const options: [Device, string, string, string | undefined][] = [
    ['computer', texts.computer, 'monitor', hints.computer],
    ['phone', texts.phone, 'smartphone', hints.phone],
  ];
  return (
    <fieldset class="manual-devices" aria-label={texts.deviceGroup}>
      {options.map(([device, name, icon, key]) => (
        <button
          key={device}
          type="button"
          aria-pressed={view.state.device === device}
          onClick={() => view.act({ type: 'chooseDevice', device, first: !view.narrow })}
        >
          <Glyph name={icon} size="small" />
          {name}
          {keys && key && <kbd>{key}</kbd>}
        </button>
      ))}
    </fieldset>
  );
}

function Top({ model, view }: { model: ManualScreen; view: View }) {
  const hints = useShortcutHints('manual');
  const back = model.back;
  return (
    <header class="manual-top desktop-only">
      <img class="manual-logo" src={logo} alt="Ferrebress" width={94} height={24} />
      <span class="manual-name">{texts.manual}</span>
      <Devices view={view} keys={true} />
      <button type="button" class="button manual-back" onClick={model.goBack}>
        <Glyph name="arrow-left" />
        <span>{back.long}</span>
        {hints.back && <kbd>{hints.back}</kbd>}
      </button>
    </header>
  );
}

function Loaded({ model, view }: { model: ManualScreen; view: View }) {
  const back = model.back;
  const ask = (
    <>
      <button type="button" class="manual-phone-back phone-only" onClick={model.goBack}>
        <Glyph name="chevron-left" size="large" />
        {back.short}
      </button>
      <h1 class="manual-question" id="manual-question">
        {texts.question}
      </h1>
      <div class="phone-only">
        <Devices view={view} keys={false} />
      </div>
    </>
  );
  return (
    <>
      <Top model={model} view={view} />
      <div class={view.narrow && view.state.sheet ? 'manual-body in-guide' : 'manual-body'}>
        <Tasks view={view} top={ask} />
        {view.task ? (
          <Guide view={view} task={view.task} />
        ) : (
          view.state.task &&
          view.chapter === 'offline' &&
          (!view.narrow || view.state.sheet) && <GuideOffline view={view} />
        )}
        {view.state.allSteps && <AllSteps view={view} />}
      </div>
    </>
  );
}

export function Manual({
  device,
  testing,
  back,
}: {
  device: Device;
  testing: boolean;
  back: Back;
}) {
  const model = useManualScreen(device, useNarrow(), back);
  return (
    <div class="manual-page" data-layer="" data-arrows="">
      {model.view ? (
        <Loaded model={model} view={model.view} />
      ) : (
        model.failed && <NeedsInternet back={back} />
      )}
      {testing && <TestEnvironment />}
    </div>
  );
}

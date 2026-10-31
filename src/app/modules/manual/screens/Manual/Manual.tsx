// El manual (00 · R6, maqueta final aprobada): en la computadora, la barra de arriba con el
// dispositivo y «Volver», las tareas a la izquierda y el paso a paso a la derecha; en el celular, las
// tareas a pantalla entera con «‹ Más» y el paso a paso en una hoja. Es una capa del teclado que
// recorre pasos (data-arrows). No lee la sesión ni pide nada a /api (R6.2, E53). En el ambiente de
// pruebas lleva el marco y el cartel, como toda pantalla (R10.1).
import type { Device } from '@ferrebress/shared/contracts/manual';
import logo from '../../../../styles/brand/logo-on-light.webp';
import { TestEnvironment } from '../../../frame/index.ts';
import type { Back } from '../../place/back.ts';
import { NeedsInternet } from '../../place/NeedsInternet.tsx';
import { texts } from '../../texts.ts';
import { useManual } from '../../useManual.ts';
import { useNarrow, type View } from '../../view.ts';
import { AllSteps } from '../AllSteps/AllSteps.tsx';
import { Glyph } from '../Glyph/Glyph.tsx';
import { Guide, GuideOffline } from '../Guide/Guide.tsx';
import { Tasks } from '../Tasks/Tasks.tsx';
import './Manual.css';

function Devices({ view, keys }: { view: View; keys: boolean }) {
  const options: [Device, string, string, string][] = [
    ['computer', texts.computer, 'monitor', 'c'],
    ['phone', texts.phone, 'smartphone', 'l'],
  ];
  return (
    <fieldset class="manual-devices" aria-label={texts.deviceGroup}>
      {options.map(([device, name, icon, key]) => (
        <button
          key={device}
          type="button"
          aria-pressed={view.state.device === device}
          data-key={keys ? key : undefined}
          onClick={() => view.act({ type: 'chooseDevice', device, first: !view.narrow })}
        >
          <Glyph name={icon} size="small" />
          {name}
          {keys && <kbd>{key.toUpperCase()}</kbd>}
        </button>
      ))}
    </fieldset>
  );
}

// Las hojas abiertas en el celular: «Volver» las cierra antes de salir (cada una es un paso atrás).
const openSheets = (view: View) =>
  view.narrow ? Number(view.state.sheet) + Number(view.state.allSteps) : 0;

function Top({ view, back }: { view: View; back: Back }) {
  return (
    <header class="manual-top desktop-only">
      <img class="manual-logo" src={logo} alt="Ferrebress" width={94} height={24} />
      <span class="manual-name">{texts.manual}</span>
      <Devices view={view} keys={true} />
      <button
        type="button"
        class="button manual-back"
        data-key="o"
        onClick={() => back.go(openSheets(view))}
      >
        <Glyph name="arrow-left" />
        <span>{back.long}</span>
        <kbd>O</kbd>
      </button>
    </header>
  );
}

function Loaded({ view, back }: { view: View; back: Back }) {
  const ask = (
    <>
      <button
        type="button"
        class="manual-phone-back phone-only"
        onClick={() => back.go(openSheets(view))}
      >
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
      <Top view={view} back={back} />
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
  const narrow = useNarrow();
  const manual = useManual(device, narrow);
  const { index, state } = manual;
  return (
    <div class="manual-page" data-layer="" data-arrows="">
      {typeof index === 'object' && state ? (
        <Loaded view={{ ...manual, index, state, narrow }} back={back} />
      ) : (
        index !== undefined && <NeedsInternet back={back} />
      )}
      {testing && <TestEnvironment />}
    </div>
  );
}

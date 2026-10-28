// «Algo salió mal» (00 · R9), desde su maqueta: qué pasó, qué hacer, qué va en el aviso (la captura
// y los últimos pasos), el código y la hora, y dos botones: «Seguir sin avisar» y «Avisar y seguir»
// (R9.5). Lo que se estaba haciendo sigue ahí (R9.3).
import { useStore } from '../../../../platform/store.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { texts } from '../../texts.ts';
import { type Crash, crash, saveReport } from './crash.ts';

const time = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function CrashDialog() {
  const shown = useStore(crash);
  if (!shown) return null;
  const t = texts.crash;
  const close = () => crash.set(undefined);
  return (
    <Dialog label={t.title} className="crash-dialog">
      <div class="crash-head">
        <span class="crash-icon">
          <Icon name="triangle-alert" size="large" />
        </span>
        <div>
          <h2 class="title">{t.title}</h2>
          <p class="crash-detail">
            <Say words={t.detail} />
          </p>
        </div>
      </div>
      <p class="crash-label">{t.whatToDo}</p>
      <ol class="crash-todo">
        {t.steps.map((step) => (
          <li key={step.long}>
            <Say words={step} />
          </li>
        ))}
      </ol>
      <Contents shown={shown} />
      <div class="crash-foot">
        <span class="crash-code">{t.code(shown.code, time(shown.at))}</span>
        <div class="crash-buttons">
          <Button doing={t.goOn} shortcut="s" closes onPress={close}>
            {t.goOn}
          </Button>
          <Button
            doing={t.reported}
            look="action"
            icon="send"
            shortcut="v"
            primary
            onPress={() => {
              saveReport(shown);
              close();
              showToast(t.saved, 'check');
            }}
          >
            {t.report}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function Contents({ shown }: { shown: Crash }) {
  const t = texts.crash;
  return (
    <>
      <p class="crash-label">{t.contents}</p>
      <div class="crash-contents">
        {shown.capture && <img class="crash-capture" src={shown.capture} alt={t.captureLabel} />}
        <ul class="crash-steps">
          {shown.steps.map((step, index) => (
            <li
              key={`${step.at}-${index}`}
              class={index === 0 ? 'crash-step failed' : 'crash-step'}
            >
              <time class="crash-step-time">{time(step.at)}</time>
              <span>
                {step.where} · {step.what}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p class="crash-privacy">
        <Icon name="lock" size="small" />
        <span>
          <Say words={t.privacy} />
        </span>
      </p>
    </>
  );
}

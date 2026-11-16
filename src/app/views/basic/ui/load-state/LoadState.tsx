// Lo que muestra una pantalla mientras trae lo suyo: «Cargando…» y, si no se pudo, lo dice y deja
// reintentar (00 · R7). La clase de cada pantalla le da su lugar; `icon`, el aviso con su triángulo.
import { Button } from '../button/Button.tsx';
import { Icon } from '../icon/Icon.tsx';

type LoadTexts = { loading: string; loadFailed: string; retry: string };

type LoadStateProps = {
  look: string;
  failed: boolean;
  texts: LoadTexts;
  retry: () => unknown;
  icon?: boolean;
};

export function LoadState({ look, failed, texts, retry, icon }: LoadStateProps) {
  if (!failed)
    return (
      <p class={look} aria-busy="true">
        {texts.loading}
      </p>
    );
  return (
    <div class={look}>
      {icon && <Icon name="triangle-alert" size="large" />}
      <b>{texts.loadFailed}</b>
      <Button icon="refresh-cw" doing={texts.retry} onPress={retry}>
        {texts.retry}
      </Button>
    </div>
  );
}

// El aviso de lo último que se vio, sin conexión o sin traer lo nuevo, con «Reintentar» y su tecla:
// igual en las pantallas de las listas de precios y en Anomalías. Con lo de ahora a la vista, no hay nada.
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import type { Words } from '../../../../platform/view/words.ts';
import { Say } from '../say/Say.tsx';
import '../parts/parts.css';

type Props = {
  // El nombre de la pantalla en el mapa de teclas, para mostrar la de «Reintentar».
  screen: string;
  view: { live: boolean; seenAtShown: string; retry: () => void };
  texts: { offline: (at: string) => Words; retry: string };
};

export function Stale({ screen, view, texts }: Props) {
  const keys = useShortcutHints(screen);
  if (view.live) return null;
  return (
    <p class="lists-stale" role="status">
      <Say words={texts.offline(view.seenAtShown)} />
      <button type="button" class="lists-button" data-mark="" onClick={view.retry}>
        {texts.retry}
        {keys.retry && <kbd>{keys.retry}</kbd>}
      </button>
    </p>
  );
}

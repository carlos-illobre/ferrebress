// El aviso de lo último que se vio, sin conexión, con «Reintentar» y su tecla: igual en Lectores y en
// Archivos de listas.
import type { Words } from '../../../platform/view/words.ts';
import { Say } from '../ui/say/Say.tsx';
import './Parts.css';

type Props = { words: Words; retry: () => void; label: string; hint: string | undefined };

export function Stale({ words, retry, label, hint }: Props) {
  return (
    <p class="lists-stale" role="status">
      <Say words={words} />
      <button type="button" class="lists-button" data-mark="" onClick={retry}>
        {label}
        {hint && <kbd>{hint}</kbd>}
      </button>
    </p>
  );
}

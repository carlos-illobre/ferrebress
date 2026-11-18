// Catálogo → Listas → ver qué cambia y aplicar (08 · pantalla 3, R6): de quién es la lista, los
// avisos, el resumen que filtra el detalle, el botón que dice lo que va a pasar, y el detalle. Una sola
// pantalla para los dos anchos. Se baja recién al abrirla (CatalogSlot).
import {
  reviewTexts as texts,
  useReview,
  type Review as View,
} from '../../../../modules/price-lists/model.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import { PhoneLight } from '../../frame/index.ts';
import { LoadState } from '../../ui/load-state/LoadState.tsx';
import { Say } from '../../ui/say/Say.tsx';
import { ScreenSearch } from '../../ui/screen-search/ScreenSearch.tsx';
import '../../ui/parts/parts.css';
import { Stale } from '../../ui/stale/Stale.tsx';
import { Rows } from './Rows.tsx';
import './Review.css';

type Seen = NonNullable<View['view']>;

function Head({ view, seen }: { view: View; seen: Seen }) {
  const header = seen.header;
  return (
    <header class="review-head">
      <button type="button" class="review-back" data-mark="" onClick={view.back}>
        ‹ {texts.back}
      </button>
      <h1>{header.supplier}</h1>
      <PhoneLight />
      <p class="review-facts">
        <span>{header.date}</span>
        <span>{header.scope}</span>
        <span>{header.uploaded}</span>
        <span>{header.fileName}</span>
        {seen.file ? (
          <button type="button" data-mark="" onClick={() => void view.download()}>
            {texts.download}
          </button>
        ) : (
          <span>{texts.noFile}</span>
        )}
      </p>
      {header.newReader && (
        <p class="review-alert" role="note">
          <Say words={texts.newReader} />
        </p>
      )}
    </header>
  );
}

function Warnings({ seen }: { seen: Seen }) {
  return (
    <>
      {seen.goneWarning && (
        <p class="review-alert" role="note">
          <Say words={seen.goneWarning} />
        </p>
      )}
      {seen.tooOld && (
        <p class="review-alert" role="note">
          <Say words={texts.tooOld} />
        </p>
      )}
      {seen.failed && <p class="review-alert">{seen.failed}</p>}
      {seen.reviewing && (
        <p class="review-note">
          <Say words={texts.reviewNote} />
        </p>
      )}
    </>
  );
}

function Actions({ view, seen }: { view: View; seen: Seen }) {
  const keys = useShortcutHints('price-lists-review');
  return (
    <div class="review-actions">
      {seen.status && <b>{seen.status}</b>}
      {seen.applying && <b role="status">{seen.applying}</b>}
      {seen.applied && <b role="status">{seen.applied}</b>}
      {view.said && (
        <p class="review-said" role="alert">
          {view.said}
        </p>
      )}
      {view.applyLabel && (
        <button
          type="button"
          class="lists-button review-apply"
          data-mark=""
          onClick={() => void view.apply()}
        >
          {view.applyLabel}
          {keys.apply && <kbd>{keys.apply}</kbd>}
        </button>
      )}
      {view.canDiscard && (
        <button type="button" class="lists-button" data-mark="" onClick={() => void view.discard()}>
          {texts.discard}
          {keys.discard && <kbd>{keys.discard}</kbd>}
        </button>
      )}
      {view.canCancel && (
        <button type="button" class="lists-button" data-mark="" onClick={() => void view.cancel()}>
          {texts.cancel}
          {keys.cancel && <kbd>{keys.cancel}</kbd>}
        </button>
      )}
    </div>
  );
}

function Chips({ view, seen }: { view: View; seen: Seen }) {
  return (
    <div class="review-chips">
      {seen.chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          class={chip.urgent ? 'lists-chip review-chip-urgent' : 'lists-chip'}
          data-mark=""
          aria-pressed={chip.pressed}
          onClick={() => view.toggleShow(chip.value)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

// La lista sale de la dirección (CatalogSlot).
export function Review({ listId }: { listId: string }) {
  const view = useReview(listId);
  const seen = view.view;
  if (!seen)
    return (
      <div class="review">
        <LoadState look="review-loading" failed={view.failed} texts={texts} retry={view.retry} />
      </div>
    );
  return (
    <div class={view.live ? 'review' : 'review review-stale'}>
      <Head view={view} seen={seen} />
      <Stale screen="price-lists-review" view={view} texts={texts} />
      <Warnings seen={seen} />
      <Actions view={view} seen={seen} />
      <Chips view={view} seen={seen} />
      <ScreenSearch look="review-search" words={texts.search} view={view} />
      <Rows view={view} />
    </div>
  );
}

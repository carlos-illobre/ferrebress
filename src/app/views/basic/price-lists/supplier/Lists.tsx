// Las listas de un proveedor (R6.7): de la más nueva a la más vieja, con su fecha, su estado, quién la
// subió y quién la aplicó o descartó, y su archivo para bajar; la que está en espera lleva a ver qué
// cambia.
import { type Supplier, supplierTexts as texts } from '../../../../modules/price-lists/model.ts';

export function Lists({ view }: { view: Supplier }) {
  if (view.listsEmpty) return <p class="supplier-muted">{view.listsEmpty}</p>;
  return (
    <>
      <ul class="supplier-rows">
        {view.lists.map((list) => (
          <li key={list.id}>
            <b>{list.title}</b>
            <span>
              {list.status}
              {list.reason && ` · ${list.reason}`}
            </span>
            <small>{list.uploaded}</small>
            {list.decided && <small>{list.decided}</small>}
            <small>{list.fileName}</small>
            {list.file ? (
              <button
                type="button"
                class="lists-button"
                data-mark=""
                onClick={() => void view.download(list.id, list.fileName)}
              >
                {texts.download}
              </button>
            ) : (
              <small>{texts.noFile}</small>
            )}
            {list.reviewable && (
              <button
                type="button"
                class="lists-button"
                data-mark=""
                onClick={() => view.review(list.id)}
              >
                {texts.review}
              </button>
            )}
          </li>
        ))}
      </ul>
      {view.hasMoreLists && (
        <button
          type="button"
          class="lists-button"
          data-mark=""
          onClick={() => void view.moreLists()}
        >
          {texts.more}
        </button>
      )}
    </>
  );
}

// Lo que pregunta una lista que se sube (R4.3, R4.12): si leer una planilla muy grande, si es del
// proveedor que se dedujo por el nombre, o de cuál es, con un buscador y «Proveedor nuevo».
import {
  uploadsTexts as texts,
  type UploadLines,
  type Uploads,
} from '../../../../modules/price-lists/model.ts';
import { Say } from '../../ui/say/Say.tsx';

type Props = { view: Uploads; upload: UploadLines };

function Choose({ view, upload }: Props) {
  const key = upload.key;
  return (
    <div class="upload-choose">
      <p class="upload-ask">{texts.whose}</p>
      <input
        aria-label={texts.searchSupplier}
        placeholder={texts.searchSupplier}
        value={view.searchOf(key)}
        onInput={(event) => view.search(key, (event.target as HTMLInputElement).value)}
      />
      <ul>
        {view.optionsOf(key).map((option) => (
          <li key={option.id}>
            <button type="button" data-mark="" onClick={() => void view.pick(key, option.id)}>
              {option.name}
            </button>
          </li>
        ))}
      </ul>
      <form
        class="upload-new"
        onSubmit={(event) => {
          event.preventDefault();
          void view.createNew(key);
        }}
      >
        <input
          aria-label={texts.newName}
          placeholder={texts.newSupplier}
          maxLength={80}
          value={view.newNameOf(key)}
          onInput={(event) => view.typeNewName(key, (event.target as HTMLInputElement).value)}
        />
        <button type="submit" class="lists-button">
          {texts.createAndUse}
        </button>
      </form>
    </div>
  );
}

export function Question({ view, upload }: Props) {
  const question = upload.question;
  const key = upload.key;
  if (question.kind === 'size')
    return (
      <div class="upload-ask">
        <Say words={question.words} />
        <button
          type="button"
          class="lists-button"
          data-mark=""
          onClick={() => void view.readAnyway(key)}
        >
          {texts.readAnyway}
        </button>
      </div>
    );
  if (question.kind === 'confirm')
    return (
      <div class="upload-ask">
        <span>{texts.isIt(question.name)}</span>
        <button
          type="button"
          class="lists-button"
          data-mark=""
          onClick={() => void view.confirm(key)}
        >
          {texts.yes}
        </button>
        <button type="button" class="lists-button" data-mark="" onClick={() => view.change(key)}>
          {texts.notThis}
        </button>
      </div>
    );
  if (question.kind === 'known')
    return (
      <div class="upload-ask">
        <b>{texts.supplierIs(question.name)}</b>
        <button type="button" class="lists-button" data-mark="" onClick={() => view.change(key)}>
          {texts.change}
        </button>
      </div>
    );
  if (question.kind === 'choose') return <Choose view={view} upload={upload} />;
  return null;
}

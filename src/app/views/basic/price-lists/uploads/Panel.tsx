// Las listas que se suben (08 · pantalla 2): un panel que no tapa la pantalla, con cada una en su
// tarjeta (R4.10): su avance, lo que pregunta, si es completa o solo cambios, y cancelar o cerrar. Se
// baja recién cuando hay alguna (UploadsSlot).
import {
  uploadsTexts as texts,
  type UploadLines,
  type Uploads,
  useUploads,
} from '../../../../modules/price-lists/model.ts';
import { Say } from '../../ui/say/Say.tsx';
import { Question } from './Question.tsx';
import './Panel.css';

function Scope({ view, upload }: { view: Uploads; upload: UploadLines }) {
  return (
    <fieldset class="upload-scope">
      <legend class="visually-hidden">{texts.full}</legend>
      {upload.scopes.map((scope) => (
        <label key={scope.value}>
          <input
            type="radio"
            name={`scope-${upload.key}`}
            checked={scope.checked}
            onChange={() => void view.setScope(upload.key, scope.value)}
          />
          {scope.label}
        </label>
      ))}
      {upload.partial && <small>{texts.partialSays}</small>}
    </fieldset>
  );
}

function Card({ view, upload }: { view: Uploads; upload: UploadLines }) {
  return (
    <li class={upload.failed ? 'upload upload-failed' : 'upload'}>
      <b class="upload-name">{upload.fileName}</b>
      {upload.step && (
        <p class="upload-step" role="status">
          <Say words={upload.step} />
        </p>
      )}
      {upload.error && (
        <p class="upload-error" role="alert">
          {upload.error}
        </p>
      )}
      <Question view={view} upload={upload} />
      {upload.replaces && <p class="upload-note">{texts.replaces}</p>}
      {upload.canScope && <Scope view={view} upload={upload} />}
      <div class="upload-actions">
        {upload.canReview && (
          <button
            type="button"
            class="lists-button"
            data-mark=""
            onClick={() => view.review(upload.key)}
          >
            {texts.review}
          </button>
        )}
        {upload.canCancel && (
          <button
            type="button"
            class="lists-button"
            data-mark=""
            onClick={() => view.cancel(upload.key)}
          >
            {texts.cancel}
          </button>
        )}
        {upload.canClose && (
          <button
            type="button"
            class="lists-button"
            data-mark=""
            onClick={() => view.close(upload.key)}
          >
            {texts.close}
          </button>
        )}
      </div>
    </li>
  );
}

export function UploadsPanel() {
  const view = useUploads();
  return (
    <section class="uploads" aria-label={texts.title}>
      <ul>
        {view.uploads.map((upload) => (
          <Card key={upload.key} view={view} upload={upload} />
        ))}
      </ul>
    </section>
  );
}

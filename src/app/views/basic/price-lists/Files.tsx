// Más → Administración → Archivos de listas (06 · pantalla 3, R10): arriba, cuánto ocupan contra el
// espacio (E55); debajo, cada archivo del más viejo al más nuevo, con sus listas, su proveedor y su
// estado, cuándo se subió y cuánto ocupa; bajarlo y, con «Cambiar los ajustes», borrarlo. Una sola
// pantalla para los dos anchos. Se baja recién al abrirla (AdministrationSlot).
import {
  fileLines,
  type ListFiles,
  type ListFileView,
  filesTexts as texts,
  useListFiles,
} from '../../../modules/price-lists/model.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { MoreCrumb, PhoneLight } from '../frame/index.ts';
import { deviceSettingsShapes } from '../ui/icon/device-settings-shapes.tsx';
import { addShapes, Icon } from '../ui/icon/Icon.tsx';
import { peopleShapes } from '../ui/icon/people-shapes.tsx';
import { LoadState } from '../ui/load-state/LoadState.tsx';
import { Say } from '../ui/say/Say.tsx';
import { Stale } from './Stale.tsx';
import './Files.css';

addShapes({
  download: deviceSettingsShapes.download,
  'trash-2': peopleShapes['trash-2'],
  'chevron-left': peopleShapes['chevron-left'],
});

function Actions({ view, file }: { view: ListFiles; file: ListFileView }) {
  const keys = useShortcutHints('price-lists-files');
  const removable = view.removable(file);
  return (
    <div class="files-actions">
      {view.live && (
        <button
          type="button"
          class="lists-button"
          data-mark=""
          onClick={() => void view.download(file)}
        >
          <Icon name="download" size="small" />
          {texts.download}
        </button>
      )}
      {removable === 'yes' && (
        <button
          type="button"
          class="lists-button"
          data-mark=""
          onClick={() => void view.remove(file)}
        >
          <Icon name="trash-2" size="small" />
          {texts.remove}
          {view.chosen === file.sha256 && keys.remove && <kbd>{keys.remove}</kbd>}
        </button>
      )}
      {removable === 'in-use' && <p class="files-in-use">{texts.inUse}</p>}
    </div>
  );
}

function File({ view, file }: { view: ListFiles; file: ListFileView }) {
  const lines = fileLines(file);
  return (
    <li
      class="files-item"
      onFocusCapture={() => view.choose(file.sha256)}
      aria-current={view.chosen === file.sha256 || undefined}
    >
      <ul class="files-lists">
        {lines.lists.map((list) => (
          <li key={list.id}>
            <b>{list.supplier}</b>
            <span>{list.name}</span>
            <span class="files-status">{list.status}</span>
          </li>
        ))}
      </ul>
      <p class="files-meta">
        {lines.stored} · {lines.size}
      </p>
      <Actions view={view} file={file} />
    </li>
  );
}

function Body({ view }: { view: ListFiles }) {
  if (!view.canSee) return <p class="files-permission">{texts.noCosts}</p>;
  if (!view.data)
    return <LoadState look="files-loading" failed={view.failed} texts={texts} retry={view.retry} />;
  return (
    <div class={view.live ? '' : 'files-stale'}>
      <Stale screen="price-lists-files" view={view} texts={texts} />
      <p class="files-used">
        {texts.usedLabel} <b>{view.used}</b>
      </p>
      {!view.canChange && <p class="files-permission">{texts.noPermission}</p>}
      {view.files.length === 0 ? (
        <p class="files-empty">{texts.empty}</p>
      ) : (
        <ul class="files-list">
          {view.files.map((file) => (
            <File key={file.sha256} view={view} file={file} />
          ))}
        </ul>
      )}
      {view.data.next && view.live && (
        <button
          type="button"
          class="lists-button files-more"
          data-mark=""
          onClick={() => void view.more()}
        >
          {texts.more}
        </button>
      )}
    </div>
  );
}

export function Files() {
  const view = useListFiles();
  return (
    <div class="files">
      <header class="files-head">
        <MoreCrumb name={texts.title} parent={{ name: texts.parent, open: view.back }} />
        <h1>{texts.title}</h1>
        <PhoneLight />
        <p class="files-about">
          <Say words={texts.about} />
        </p>
      </header>
      <Body view={view} />
    </div>
  );
}

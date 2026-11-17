// Más → Administración → Lectores (08 · pantalla 5, R5.8): los lectores de cada proveedor, de dónde
// salió cada uno, desde cuándo, qué lista leyó por última vez y si está activo; con «Cambiar los
// ajustes», desactivarlo o volver a activarlo. Una sola pantalla para los dos anchos. Se baja recién al
// abrirla (AdministrationSlot).
import {
  type ReaderGroup,
  readerLines,
  readersTexts as texts,
  useReaders,
  type Readers as View,
} from '../../../modules/price-lists/model.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { MoreCrumb } from '../frame/index.ts';
import { Icon } from '../ui/icon/Icon.tsx';
import { LoadState } from '../ui/load-state/LoadState.tsx';
import { Say } from '../ui/say/Say.tsx';
import { Search } from '../ui/search/Search.tsx';
import './Readers.css';

function Group({ view, group }: { view: View; group: ReaderGroup }) {
  return (
    <section class="readers-group" aria-label={group.supplier}>
      <h2>{group.supplier}</h2>
      <ul>
        {group.readers.map((reader) => {
          const lines = readerLines(reader);
          return (
            <li key={reader.id} class={`readers-item ${reader.active ? '' : 'readers-off'}`}>
              <div>
                <b>{lines.origin}</b>
                <span>{lines.since}</span>
                <span>{lines.last}</span>
              </div>
              <span class="readers-state">{reader.active ? texts.active : texts.inactive}</span>
              {view.editable && (
                <button
                  type="button"
                  class="readers-toggle"
                  data-mark=""
                  onClick={() => void view.toggle(reader)}
                >
                  {reader.active ? texts.deactivate : texts.activate}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Body({ view }: { view: View }) {
  const keys = useShortcutHints('price-lists-readers');
  if (!view.data)
    return (
      <LoadState look="readers-loading" failed={view.failed} texts={texts} retry={view.retry} />
    );
  return (
    <div class={view.fresh && view.online ? '' : 'readers-stale'}>
      {!(view.fresh && view.online) && (
        <p class="readers-offline" role="status">
          <Say words={texts.offline(view.seenAtShown)} />
          <button type="button" data-mark="" onClick={view.retry}>
            {texts.retry}
            {keys.retry && <kbd>{keys.retry}</kbd>}
          </button>
        </p>
      )}
      {!view.canChange && <p class="readers-permission">{texts.noPermission}</p>}
      {view.data.readers.length === 0 ? (
        <p class="readers-empty">
          <Say words={texts.empty} />
        </p>
      ) : view.groups.length === 0 ? (
        <p class="readers-empty">{texts.noMatch}</p>
      ) : (
        view.groups.map((group) => <Group key={group.supplier} view={view} group={group} />)
      )}
    </div>
  );
}

export function Readers() {
  const view = useReaders();
  return (
    <div class="readers">
      <header class="readers-head">
        <MoreCrumb name={texts.title} parent={{ name: texts.parent, open: view.back }} />
        <h1>{texts.title}</h1>
        <p class="readers-about">
          <Say words={texts.about} />
        </p>
        <Search
          look="readers-search"
          icon={<Icon name="search" size="small" />}
          placeholder={texts.search}
          aria-label={texts.search.long}
          value={view.search}
          onText={view.setSearch}
          data-slash=""
          data-clear=""
        />
      </header>
      <Body view={view} />
    </div>
  );
}

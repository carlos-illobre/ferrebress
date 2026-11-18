// El panel de los ajustes de las listas de precios (R8): seis números en tres partes (al ver qué
// cambia, al subir y los archivos), cada uno con qué cambia y su valor de arranque. Se escriben y se
// guardan al salir de la caja o con Enter, como los márgenes.
import {
  groupOf,
  initialOf,
  listParts,
  type NumberSetting,
  names,
  numberUnits,
  texts,
  thousands,
  what,
} from '../../../modules/administration/model.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, type PanelProps } from './look.ts';

// Un ajuste que se escribe como un número, con qué cambia y su valor de arranque.
export function NumberField({ view, settings, name }: PanelProps & { name: NumberSetting }) {
  const now = settings[name];
  return (
    <div class="admin-list-setting">
      <label class="admin-margin">
        <span class="admin-list-name">{names[name]}</span>
        <input
          key={now}
          inputMode="numeric"
          aria-label={names[name]}
          defaultValue={thousands(now)}
          readOnly={locked(view)}
          onBlur={(event) => view.typeSetting(name, (event.target as HTMLInputElement).value)}
          data-commit=""
        />
        <span>{numberUnits[name]}</span>
      </label>
      <p class="admin-detail">{what[name].long}</p>
      <p class="admin-detail">{texts.lists.initial(initialOf(name))}</p>
      <Said note={view.said} keys={[name]} />
    </div>
  );
}

export function ListsPanel({ view, settings }: PanelProps) {
  return (
    <>
      <Heading
        group={groupOf.lists}
        icon="file-text"
        title={texts.lists.title}
        subtitle={texts.lists.subtitle}
        locked={locked(view)}
      />
      {listParts.map((part) => (
        <section key={part.title}>
          <Subhead>{part.title}</Subhead>
          <div class="admin-two">
            {part.keys.map((name) => (
              <NumberField key={name} view={view} settings={settings} name={name} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

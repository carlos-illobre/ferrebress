// El panel de los ajustes de las listas de precios (R8): seis números en tres partes (al ver qué
// cambia, al subir y los archivos), cada uno con qué cambia y su valor de arranque. Se escriben y se
// guardan al salir de la caja o con Enter, como los márgenes.
import { type SettingKey, settingList } from '@ferrebress/shared/contracts/administration';
import {
  groupOf,
  type ListSetting,
  names,
  shown,
  texts,
  thousands,
  what,
} from '../../../modules/administration/model.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, type PanelProps } from './look.ts';

const parts: { title: string; keys: ListSetting[] }[] = [
  { title: texts.lists.review, keys: ['reviewPercent', 'goneWarnPercent'] },
  { title: texts.lists.upload, keys: ['maxFileMb', 'confirmRows'] },
  { title: texts.lists.files, keys: ['filesMb', 'unappliedFileDays'] },
];

const units: Record<ListSetting, string> = {
  reviewPercent: '%',
  goneWarnPercent: '%',
  maxFileMb: 'MB',
  confirmRows: 'filas',
  filesMb: 'MB',
  unappliedFileDays: 'días',
};

function Field({ view, settings, name }: PanelProps & { name: ListSetting }) {
  const now = settings[name];
  // Lo escrito, sin los puntos de miles; vacío o con letras no es un número y lo dice el servidor.
  const write = (text: string) => {
    const typed = Number(text.replace(/\./g, '').trim() || Number.NaN);
    if (typed !== now) void view.save(name as SettingKey, typed);
  };
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
          onBlur={(event) => write((event.target as HTMLInputElement).value)}
          data-commit=""
        />
        <span>{units[name]}</span>
      </label>
      <p class="admin-detail">{what[name].long}</p>
      <p class="admin-detail">{texts.lists.initial(shown(name, settingList[name].initial))}</p>
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
      {parts.map((part) => (
        <section key={part.title}>
          <Subhead>{part.title}</Subhead>
          <div class="admin-two">
            {part.keys.map((name) => (
              <Field key={name} view={view} settings={settings} name={name} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

// Lo encontrado (00 · R6.6, maqueta final del manual): solo del dispositivo elegido, una fila por
// tarea con el fragmento que coincidió y lo buscado resaltado, agrupadas bajo su capítulo en el orden
// de la lista; en el ambiente de pruebas, también los capítulos que faltan cuyo nombre coincide. Sin
// nada, lo dice. Sin conexión, el buscador dice «Sin conexión».
import { tasksOf } from '../../state.ts';
import { texts } from '../../texts.ts';
import type { View } from '../../view.ts';
import { Glyph } from '../Glyph/Glyph.tsx';
import { highlighted, Row, Soon } from './Rows.tsx';

export function Results({ view }: { view: View }) {
  const { found, searched, state, act } = view;
  if (view.searchFailed) return <p class="manual-group offline">{texts.offline}</p>;
  if (!found) return null;
  return (
    <>
      {found.groups.map(({ chapter, hits }) => (
        <div key={chapter.id}>
          <h2 class="manual-group">
            <Glyph name={chapter.icon} size="small" />
            {chapter.name} · {texts.found(hits.length)}
          </h2>
          <ul class="manual-task-list">
            {hits.map((hit) => {
              const icon = tasksOf(view.index, hit.chapter, state.device).find(
                (task) => task.id === hit.task,
              )?.icon;
              return (
                <Row
                  key={hit.task}
                  icon={icon ?? chapter.icon}
                  name={hit.title}
                  detail={highlighted(hit.snippet, searched)}
                  onOpen={() =>
                    act({ type: 'openTask', chapter: hit.chapter, task: hit.task, step: hit.step })
                  }
                />
              );
            })}
          </ul>
        </div>
      ))}
      {found.groups.length === 0 && <p class="manual-group">{texts.notFound(searched.trim())}</p>}
      {found.soon.length > 0 && <Soon chapters={found.soon} />}
    </>
  );
}

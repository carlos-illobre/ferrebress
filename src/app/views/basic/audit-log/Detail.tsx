// El detalle de una acción (R4.7): todo lo que se guardó de ella. En la computadora está siempre al
// lado de la lista; en el celular, en una hoja que sube al tocar la acción.
import { type DetailLines, texts } from '../../../modules/audit-log/model.ts';
import { privateProps } from '../../../platform/view/private.ts';
import { Icon } from '../ui/icon/Icon.tsx';
import { Actor, PersonName, Said } from './Pieces.tsx';
import './Detail.css';

export function DetailBody({ lines }: { lines: DetailLines }) {
  const { event } = lines;
  return (
    <div class="audit-detail-body" {...privateProps()}>
      <div class="audit-pills">
        {lines.pill && <span class={`audit-pill audit-${event.tone}`}>{lines.pill}</span>}
      </div>
      <p class="audit-sentence">
        <Actor actor={event.actor} /> <Said said={lines.said} />
      </p>
      <p class="audit-when">
        <Icon name="clock" size="small" />
        {lines.when}
      </p>
      {lines.targets.length > 0 && (
        <section class="audit-block">
          <h3>{texts.whom}</h3>
          <ul>
            {lines.targets.map((target) => (
              <li key={`${target.kind}:${target.id}`}>
                {target.kind === 'person' ? <PersonName person={target} /> : target.name}
              </li>
            ))}
          </ul>
        </section>
      )}
      {lines.changes.length > 0 && (
        <section class="audit-block">
          <h3>{texts.changed}</h3>
          <dl class="audit-changes">
            {lines.changes.map((change) => (
              <div key={change.field}>
                <dt>{change.label}</dt>
                <dd>
                  <s>{change.before}</s>
                  <Icon name="arrow-right" size="small" />
                  <b>{change.after}</b>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <Where lines={lines} />
      {event.truncated && <p class="audit-note">{texts.truncated}</p>}
    </div>
  );
}

// Desde dónde (05 · R2.6): el tipo de dispositivo, su nombre de ese momento, el navegador y la
// dirección.
function Where({ lines }: { lines: DetailLines }) {
  return (
    <section class="audit-block">
      <h3>{texts.from_where}</h3>
      <dl class="audit-where" {...privateProps()}>
        {lines.where.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {lines.browserNote && <p class="audit-note">{texts.browserNote}</p>}
    </section>
  );
}

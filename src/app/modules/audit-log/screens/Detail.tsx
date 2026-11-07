// El detalle de una acción (R4.7): todo lo que se guardó de ella. En la computadora está siempre al
// lado de la lista; en el celular, en una hoja que sube al tocar la acción.
import type { AuditView } from '@ferrebress/shared/contracts/audit-log';
import { isPermission, permissionOf } from '@ferrebress/shared/contracts/permissions';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { browserOf, businessDay, dayTitle, timeOf } from '../logic.ts';
import { texts } from '../texts.ts';
import { Actor, PersonName, Said } from './Pieces.tsx';
import './Detail.css';

// Un valor de antes o de después, en palabras: los permisos, por su nombre.
function shown(field: string, value: unknown): string {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0))
    return texts.nothing;
  if (!Array.isArray(value)) return String(value);
  const named =
    field === 'permissions'
      ? value.map((id) => (isPermission(id) ? permissionOf(id).name : id))
      : value;
  return named.join(', ');
}

function When({ event, today }: { event: AuditView; today: string }) {
  const day = dayTitle(businessDay(event.at), today);
  if (event.deviceTime)
    return (
      <p class="audit-when">
        <Icon name="clock" size="small" />
        {`${dayTitle(businessDay(event.deviceTime), today)} · ${timeOf(event.deviceTime)} · ${texts.deviceTime} · ${texts.arrived(timeOf(event.at))}`}
      </p>
    );
  return (
    <p class="audit-when">
      <Icon name="clock" size="small" />
      {`${day} · ${timeOf(event.at)} · ${texts.serverTime}`}
    </p>
  );
}

export function DetailBody({ event, today }: { event: AuditView; today: string }) {
  const changes = Object.entries(event.changes);
  const browser = browserOf(event.device);
  return (
    <div class="audit-detail-body" data-private="">
      <div class="audit-pills">
        {event.tone !== 'plain' && (
          <span class={`audit-pill audit-${event.tone}`}>
            {event.tone === 'red' ? texts.red : texts.amber}
          </span>
        )}
      </div>
      <p class="audit-sentence">
        <Actor actor={event.actor} /> <Said event={event} afterName />
      </p>
      <When event={event} today={today} />
      {event.targets.length > 0 && (
        <section class="audit-block">
          <h3>{texts.whom}</h3>
          <ul>
            {event.targets.map((target) => (
              <li key={`${target.kind}:${target.id}`}>
                {target.kind === 'person' ? <PersonName person={target} /> : target.name}
              </li>
            ))}
          </ul>
        </section>
      )}
      {changes.length > 0 && (
        <section class="audit-block">
          <h3>{texts.changed}</h3>
          <dl class="audit-changes">
            {changes.map(([field, change]) => (
              <div key={field}>
                <dt>{texts.fields[field] ?? field}</dt>
                <dd>
                  <s>{shown(field, change.before)}</s>
                  <Icon name="arrow-right" size="small" />
                  <b>{shown(field, change.after)}</b>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <Where event={event} browser={browser} />
      {event.truncated && <p class="audit-note">{texts.truncated}</p>}
    </div>
  );
}

// Desde dónde (05 · R2.6): el tipo de dispositivo, su nombre de ese momento, el navegador y la
// dirección.
function Where({ event, browser }: { event: AuditView; browser: string | undefined }) {
  const rows = [
    event.device && [texts.device, event.device.phone ? texts.phone : texts.computer],
    event.device?.name && [texts.deviceName, event.device.name],
    browser && [texts.browser, browser],
    event.ipAddress && [texts.address, event.ipAddress],
  ].filter((row): row is [string, string] => !!row);
  return (
    <section class="audit-block">
      <h3>{texts.from_where}</h3>
      <dl class="audit-where" data-private="">
        {rows.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {event.device && <p class="audit-note">{texts.browserNote}</p>}
    </section>
  );
}

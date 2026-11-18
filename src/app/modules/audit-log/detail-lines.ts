// El detalle de una acción (05 · R4.7, R2.6), resuelto para cualquier vista: su marca, cuándo pasó
// (con la hora del dispositivo si la trajo), a quiénes, qué cambió en palabras y desde dónde.
import type { AuditView } from '@ferrebress/shared/contracts/audit-log';
import { isPermission, permissionOf } from '@ferrebress/shared/contracts/permissions';
import { browserOf, businessDay, dayTitle, timeOf } from './logic.ts';
import { iconOf, saidOf } from './row-lines.ts';
import { texts } from './texts.ts';

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

function whenOf(event: AuditView, today: string) {
  if (event.deviceTime)
    return `${dayTitle(businessDay(event.deviceTime), today)} · ${timeOf(event.deviceTime)} · ${texts.deviceTime} · ${texts.arrived(timeOf(event.at))}`;
  return `${dayTitle(businessDay(event.at), today)} · ${timeOf(event.at)} · ${texts.serverTime}`;
}

// Desde dónde: el tipo de dispositivo, su nombre de ese momento, el navegador y la dirección.
function whereOf(event: AuditView) {
  const browser = browserOf(event.device);
  return [
    event.device && [texts.device, event.device.phone ? texts.phone : texts.computer],
    event.device?.name && [texts.deviceName, event.device.name],
    browser && [texts.browser, browser],
    event.ipAddress && [texts.address, event.ipAddress],
  ].filter((row): row is [string, string] => !!row);
}

export function detailLines(event: AuditView, today: string) {
  return {
    event,
    icon: iconOf(event),
    said: saidOf(event, true),
    pill: event.tone === 'plain' ? undefined : event.tone === 'red' ? texts.red : texts.amber,
    when: whenOf(event, today),
    targets: event.targets,
    changes: Object.entries(event.changes).map(([field, change]) => ({
      field,
      label: texts.fields[field] ?? field,
      before: shown(field, change.before),
      after: shown(field, change.after),
    })),
    where: whereOf(event),
    browserNote: !!event.device,
  };
}

export type DetailLines = ReturnType<typeof detailLines>;

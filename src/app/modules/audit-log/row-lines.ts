// Cada acción de Quién hizo qué (05 · R4.7, R4.10), resuelta para cualquier vista: su ícono, su texto
// en trozos (con los nombres de las personas), la hora y, si no es de hoy, la fecha; los días de la
// lista con cuántas acciones tiene cada uno; y la paginación.
import { entryOf, type Piece } from '@ferrebress/shared/audit-log/index';
import type { AuditPage, AuditView } from '@ferrebress/shared/contracts/audit-log';
import { businessDay, byDay, dayTitle, shortDateOf, timeOf } from './logic.ts';
import { texts } from './texts.ts';

// El texto en trozos; `afterName`: va después de quién lo hizo, así que empieza en minúscula («Ana le
// sacó…»).
export function saidOf(event: AuditView, afterName = false): Piece[] {
  return entryOf(event.type)
    .says(event)
    .map((piece, index) =>
      afterName && index === 0 && 'text' in piece
        ? { text: piece.text.charAt(0).toLowerCase() + piece.text.slice(1) }
        : piece,
    );
}

export const iconOf = (event: AuditView) => entryOf(event.type).icon;

export function rowLines(event: AuditView, today: string) {
  return {
    event,
    icon: iconOf(event),
    said: saidOf(event),
    time: timeOf(event.deviceTime ?? event.at),
    // De otro día, la fecha al lado de la hora.
    date: businessDay(event.at) !== today ? shortDateOf(event.at) : undefined,
    // La hora del celular, marcada (E09).
    note: event.deviceTime ? texts.deviceTime : undefined,
    device: event.device && {
      phone: event.device.phone,
      title: event.device.phone ? texts.phone : texts.computer,
    },
  };
}

export type RowLines = ReturnType<typeof rowLines>;

export const ledgerDays = (page: AuditPage) =>
  byDay(page.events).map((day) => ({
    date: day.date,
    title: dayTitle(day.date, page.today),
    count: texts.actions(page.days[day.date] as number),
    rows: day.events.map((event) => rowLines(event, page.today)),
  }));

// «45 acciones · página 1 de 3», con anterior y siguiente (sin nada, no se muestra).
export const pagerOf = (page: AuditPage | undefined) =>
  page && page.total > 0
    ? {
        total: texts.actions(page.total),
        of: texts.pageOf(page.page, page.pages),
        page: page.page,
        first: page.page === 1,
        last: page.page === page.pages,
      }
    : undefined;

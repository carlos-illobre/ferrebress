// La lista (R4.2 a R4.4): de la más nueva a la más vieja, agrupada por día con su cantidad; cada
// acción con el ícono de su tipo, la hora (y la fecha si no es de hoy), quién, qué pasó y el
// dispositivo, con su color; la hora del celular, con su marca (E09). En la computadora, recorrerla con el teclado cambia el detalle (E35d).
import type { AuditPage, AuditView } from '@ferrebress/shared/contracts/audit-log';
import { useEffect, useRef } from 'preact/hooks';
import {
  auditLogSettings,
  businessDay,
  byDay,
  dayTitle,
  ledgerScroll,
  shortDateOf,
  texts,
  timeOf,
  useAuditLogContext,
} from '../../../modules/audit-log/model.ts';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { ActionIcon, Actor, Said } from './Pieces.tsx';
import './Ledger.css';

function Row({ event, today }: { event: AuditView; today: string }) {
  const log = useAuditLogContext();
  const other = businessDay(event.at) !== today;
  return (
    <div
      role="option"
      tabIndex={-1}
      aria-selected={log.selected === event.id}
      class={`audit-row audit-${event.tone}`}
      data-mark=""
      data-id={event.id}
      data-new={log.fresh.has(event.id) ? '' : undefined}
      onClick={() => log.select(event.id)}
      onKeyDown={(key) => key.key === ' ' && log.select(event.id)}
    >
      <ActionIcon event={event} />
      <span class="audit-time">
        {timeOf(event.deviceTime ?? event.at)}
        {other && <small>{shortDateOf(event.at)}</small>}
      </span>
      <span class="audit-by">
        <Actor actor={event.actor} />
      </span>
      <Said event={event} note={event.deviceTime && texts.deviceTime} />
      {event.device && (
        <span class="audit-device" title={event.device.phone ? texts.phone : texts.computer}>
          <Icon name={event.device.phone ? 'smartphone' : 'monitor'} size="small" />
        </span>
      )}
    </div>
  );
}

// Lo que marca el teclado es lo que muestra el detalle.
function useMarkSelects() {
  const log = useAuditLogContext();
  useEffect(() => {
    const follow = (event: Event) => {
      const id = (event as CustomEvent<HTMLElement | undefined>).detail?.dataset.id;
      if (id) log.select(id);
    };
    document.addEventListener('mark', follow);
    return () => document.removeEventListener('mark', follow);
  }, [log.select]);
}

// Qué se desplaza: la lista y todo lo que la contiene (en Usuarios se desplaza todo su contenido). Le
// dice a la lógica si está arriba de todo y cómo volver (R4.6).
function useScroll(list: { current: HTMLElement | null }) {
  useEffect(() => {
    const scrollers = () => {
      const found: HTMLElement[] = [];
      for (let el = list.current; el; el = el.parentElement) found.push(el);
      return found;
    };
    return ledgerScroll.set({
      atTop: () => scrollers().every((el) => el.scrollTop < auditLogSettings.live.topPx),
      toTop: () => {
        for (const el of scrollers()) el.scrollTop = 0;
      },
    });
  }, []);
}

export function Ledger({ page }: { page: AuditPage }) {
  useMarkSelects();
  const list = useRef<HTMLDivElement>(null);
  useScroll(list);
  return (
    <div class="audit-ledger" role="listbox" aria-label={texts.title} ref={list}>
      {byDay(page.events).map((day) => (
        <section key={day.date} class="audit-day">
          <h2>
            <span>{dayTitle(day.date, page.today)}</span>
            <small>{texts.actions(page.days[day.date] as number)}</small>
          </h2>
          {day.events.map((event) => (
            <Row key={event.id} event={event} today={page.today} />
          ))}
        </section>
      ))}
    </div>
  );
}

// «45 acciones · página 1 de 3», con anterior y siguiente; RePág y AvPág en la computadora.
export function Pager() {
  const log = useAuditLogContext();
  const page = log.page;
  if (!page || page.total === 0) return null;
  return (
    <nav class="audit-pager" aria-label={texts.pageOf(page.page, page.pages)}>
      <span class="audit-total">{texts.actions(page.total)}</span>
      <button
        type="button"
        class="audit-page-button"
        aria-label={texts.previous}
        data-page="previous"
        disabled={page.page === 1}
        onClick={() => log.goTo(page.page - 1)}
      >
        <Icon name="chevron-left" />
      </button>
      <span class="audit-page">{texts.pageOf(page.page, page.pages)}</span>
      <button
        type="button"
        class="audit-page-button"
        aria-label={texts.next}
        data-page="next"
        disabled={page.page === page.pages}
        onClick={() => log.goTo(page.page + 1)}
      >
        <Icon name="chevron-right" />
      </button>
    </nav>
  );
}

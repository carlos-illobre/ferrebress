// La lista (R4.2 a R4.4): de la más nueva a la más vieja, agrupada por día con su cantidad; cada
// acción con el ícono de su tipo, la hora (y la fecha si no es de hoy), quién, qué pasó y el
// dispositivo, con su color; la hora del celular, con su marca (E09). En la computadora, recorrerla con el teclado cambia el detalle (E35d).
import { useEffect, useRef } from 'preact/hooks';
import {
  auditLogSettings,
  ledgerScroll,
  type RowLines,
  texts,
  useAuditLogContext,
} from '../../../modules/audit-log/model.ts';
import { useMarkedId } from '../../../platform/view/page.ts';
import { Icon } from '../ui/icon/Icon.tsx';
import { ActionIcon, Actor, Said } from './Pieces.tsx';
import './Ledger.css';

function Row({ row }: { row: RowLines }) {
  const log = useAuditLogContext();
  const { event } = row;
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Espacio y Enter sobre el renglón los maneja la navegación del teclado (ADR-019), no la vista.
    <div
      role="option"
      tabIndex={-1}
      aria-selected={log.selected === event.id}
      class={`audit-row audit-${event.tone}`}
      data-mark=""
      data-id={event.id}
      data-new={log.fresh.has(event.id) ? '' : undefined}
      onClick={() => log.select(event.id)}
    >
      <ActionIcon event={event} icon={row.icon} />
      <span class="audit-time">
        {row.time}
        {row.date && <small>{row.date}</small>}
      </span>
      <span class="audit-by">
        <Actor actor={event.actor} />
      </span>
      <Said said={row.said} note={row.note} />
      {row.device && (
        <span class="audit-device" title={row.device.title}>
          <Icon name={row.device.phone ? 'smartphone' : 'monitor'} size="small" />
        </span>
      )}
    </div>
  );
}

// Lo que marca el teclado es lo que muestra el detalle.
function useMarkSelects() {
  const log = useAuditLogContext();
  useMarkedId(log.select);
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

export function Ledger() {
  const log = useAuditLogContext();
  useMarkSelects();
  // vista: la lista, para saber si está arriba de todo.
  const list = useRef<HTMLDivElement>(null);
  useScroll(list);
  return (
    <div class="audit-ledger" role="listbox" aria-label={texts.title} ref={list}>
      {log.days.map((day) => (
        <section key={day.date} class="audit-day">
          <h2>
            <span>{day.title}</span>
            <small>{day.count}</small>
          </h2>
          {day.rows.map((row) => (
            <Row key={row.event.id} row={row} />
          ))}
        </section>
      ))}
    </div>
  );
}

// «45 acciones · página 1 de 3», con anterior y siguiente; RePág y AvPág en la computadora.
export function Pager() {
  const log = useAuditLogContext();
  const pager = log.pager;
  if (!pager) return null;
  return (
    <nav class="audit-pager" aria-label={pager.of}>
      <span class="audit-total">{pager.total}</span>
      <button
        type="button"
        class="audit-page-button"
        aria-label={texts.previous}
        data-page="previous"
        disabled={pager.first}
        onClick={() => log.goTo(pager.page - 1)}
      >
        <Icon name="chevron-left" />
      </button>
      <span class="audit-page">{pager.of}</span>
      <button
        type="button"
        class="audit-page-button"
        aria-label={texts.next}
        data-page="next"
        disabled={pager.last}
        onClick={() => log.goTo(pager.page + 1)}
      >
        <Icon name="chevron-right" />
      </button>
    </nav>
  );
}

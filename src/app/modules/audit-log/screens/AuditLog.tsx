// La pestaña Quién hizo qué (capítulo 05; maqueta users-who-did-what, variante 1, «El libro»): el
// resumen, los filtros, la lista por páginas y el detalle, al costado en la computadora y en una
// hoja en el celular. Sin conexión se ve gris, con lo último que trajo, y sale del gris sin pedir
// nada al volver (R5.1). La cinta se abre encima (R4.11). «Actualizar solo» va donde estaba
// «Actualizar» (R4.6).
import type { AuditPage, AuditView } from '@ferrebress/shared/contracts/audit-log';
import { useRef } from 'preact/hooks';
import { Button } from '../../../ui/button/Button.tsx';
import { auditLogShapes } from '../../../ui/icon/audit-log-shapes.tsx';
import { addShapes } from '../../../ui/icon/Icon.tsx';
import { LoadState } from '../../../ui/load-state/LoadState.tsx';
import { Offline } from '../../../ui/offline/Offline.tsx';
import { Sheet } from '../../../ui/sheet/Sheet.tsx';
import { hasFilters, summaryDay } from '../logic.ts';
import { AuditLogContext, useAuditLog, useAuditLogContext } from '../state.ts';
import { texts } from '../texts.ts';
import { DetailBody } from './Detail.tsx';
import { Filters } from './Filters.tsx';
import { Ledger, Pager } from './Ledger.tsx';
import { LiveSwitch, NewOnes } from './Live.tsx';
import { Summary } from './Summary.tsx';
import { Tape } from './Tape.tsx';
import './AuditLog.css';

addShapes(auditLogShapes);

function Empty() {
  const log = useAuditLogContext();
  if (hasFilters(log.filters))
    return (
      <div class="audit-empty">
        <b>{texts.noMatch}</b>
        <Button icon="x" doing={texts.clearFilters} onPress={log.clear}>
          {texts.clearFilters}
        </Button>
      </div>
    );
  return (
    <div class="audit-empty">
      <b>{texts.empty}</b>
      <span>{texts.emptyDetail}</span>
    </div>
  );
}

// La acción elegida, aunque al ponerse al día sola haya pasado a la página 2 (R4.6, R4.7): se sigue
// mostrando la que estaba hasta que se elija otra.
function useChosen(page: AuditPage, selected: string | undefined): AuditView | undefined {
  const kept = useRef<AuditView | undefined>(undefined);
  const found = page.events.find((one) => one.id === selected);
  if (found || kept.current?.id !== selected) kept.current = found;
  return kept.current;
}

function Detail({ page }: { page: AuditPage }) {
  const log = useAuditLogContext();
  const event = useChosen(page, log.selected);
  const today = page.today;
  if (!log.wide)
    return event ? (
      <Sheet title={texts.title} onClose={() => log.select(undefined)} className="audit-sheet">
        <DetailBody event={event} today={today} />
        <Button closes doing={texts.close} onPress={() => log.select(undefined)}>
          {texts.close}
        </Button>
      </Sheet>
    ) : null;
  return (
    <aside class="surface audit-detail" aria-label={texts.title}>
      {event ? (
        <DetailBody event={event} today={today} />
      ) : (
        <p class="audit-note">{texts.pickOne}</p>
      )}
    </aside>
  );
}

function Body() {
  const log = useAuditLogContext();
  if (!log.page)
    return (
      <LoadState look="audit-empty" failed={log.failed} texts={texts} retry={log.retry} icon />
    );
  return (
    <div class="audit-body">
      <div class="audit-main">
        <Summary today={log.page.today} />
        <Filters />
        <div class="surface audit-list">
          <NewOnes />
          {log.page.total === 0 ? <Empty /> : <Ledger page={log.page} />}
          <Pager />
        </div>
      </div>
      <Detail page={log.page} />
    </div>
  );
}

export function AuditLog() {
  const log = useAuditLog();
  const page = log.page;
  return (
    <AuditLogContext.Provider value={log}>
      <section class="audit" aria-label={texts.title} data-off={log.online ? undefined : ''}>
        <div class="audit-tools">
          {!log.wide && page && (
            <Button
              size="small"
              icon="film"
              doing={texts.seeDay}
              onPress={() => log.openTape(summaryDay(log.filters.dates, page.today))}
              disabled={!log.online}
            >
              {texts.seeDay}
            </Button>
          )}
          <LiveSwitch />
        </div>
        {!log.online && <Offline look="audit-offline" text={texts.offline} />}
        <div class="audit-content" inert={!log.online}>
          <Body />
        </div>
      </section>
      {log.tape && <Tape />}
    </AuditLogContext.Provider>
  );
}

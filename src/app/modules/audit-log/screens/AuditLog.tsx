// La pestaña Quién hizo qué (capítulo 05; maqueta users-who-did-what, variante 1, «El libro»): el
// resumen, los filtros, la lista por páginas y el detalle, al costado en la computadora y en una
// hoja en el celular. Sin conexión se ve gris, con lo último que trajo, y sale del gris sin pedir
// nada al volver (R5.1). La cinta se abre encima (R4.11).
import type { AuditPage } from '@ferrebress/shared/contracts/audit-log';
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

function Detail({ page }: { page: AuditPage }) {
  const log = useAuditLogContext();
  const event = page.events.find((one) => one.id === log.selected);
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
    <aside class="audit-detail" aria-label={texts.title}>
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
        <div class="audit-list">
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
          <Button
            size="small"
            icon="refresh-cw"
            shortcut="r"
            doing={texts.refresh}
            onPress={log.refresh}
            disabled={!log.online}
          >
            {texts.refresh}
          </Button>
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

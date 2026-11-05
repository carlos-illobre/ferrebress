// Los filtros de la lista (R4.5): hecho por, hecho a, fecha y tipo, que se combinan; cada uno abre su
// lista encima, con su tecla en la computadora. «Sacar los filtros» vuelve a mostrar todo.
import type { AuditPage } from '@ferrebress/shared/contracts/audit-log';
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { Button } from '../../../ui/button/Button.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { optionsOf, shownValue, type Which } from '../filter-options.ts';
import { hasFilters } from '../logic.ts';
import { useAuditLogContext } from '../state.ts';
import { texts } from '../texts.ts';
import './Filters.css';

// Elegir los días a mano: desde y hasta.
function PickDates({ close }: { close: () => void }) {
  const log = useAuditLogContext();
  // Los filtros se ven con la lista ya traída.
  const today = (log.page as AuditPage).today;
  // local: el período a medio elegir; viaja al aplicarlo.
  const [from, setFrom] = useState(today);
  // local: el período a medio elegir; viaja al aplicarlo.
  const [until, setUntil] = useState(today);
  return (
    <form
      class="audit-pick-dates"
      onSubmit={(event) => {
        event.preventDefault();
        close();
        void log.filter({ dates: { from, until } });
      }}
    >
      <label>
        {texts.from}
        <input
          type="date"
          value={from}
          max={today}
          onInput={(e) => setFrom(e.currentTarget.value)}
        />
      </label>
      <label>
        {texts.until}
        <input
          type="date"
          value={until}
          max={today}
          onInput={(e) => setUntil(e.currentTarget.value)}
        />
      </label>
      <button type="submit" class="button button-common" disabled={!from || !until || from > until}>
        {texts.apply}
      </button>
    </form>
  );
}

function Pop({ which, close }: { which: Which; close: () => void }) {
  const log = useAuditLogContext();
  const options = optionsOf(which, log.filters, log.people);
  return (
    <>
      <div class="audit-pop-scrim" onClick={close} aria-hidden="true" />
      <div class="audit-pop" data-layer="" role="listbox" aria-label={texts[which]}>
        <button type="button" class="audit-pop-close" data-close="" onClick={close}>
          <Icon name="x" size="small" />
          {texts.close}
        </button>
        <div class="audit-pop-list" data-private="">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              role="option"
              aria-selected={option.chosen}
              class={option.inner ? 'audit-option inner' : 'audit-option'}
              data-mark=""
              onClick={() => {
                close();
                void log.filter(option.change);
              }}
            >
              <span>{option.label}</span>
              {option.detail && <small>{option.detail}</small>}
            </button>
          ))}
        </div>
        {which === 'dates' && <PickDates close={close} />}
      </div>
    </>
  );
}

function Chip({
  which,
  shortcut,
  children,
}: {
  which: Which;
  shortcut: string;
  children: ComponentChildren;
}) {
  const log = useAuditLogContext();
  // local: el desplegable de este dispositivo.
  const [open, setOpen] = useState(false);
  const value = shownValue(which, log.filters, log.people);
  return (
    <div class="audit-chip-wrap">
      <button
        type="button"
        class={value ? 'audit-chip on' : 'audit-chip'}
        aria-expanded={open}
        data-key={shortcut}
        data-mark=""
        onClick={() => setOpen(!open)}
      >
        {children}
        <b data-private="">{value ?? (which === 'dates' ? texts.allDates : texts.all)}</b>
        <kbd>{shortcut.toUpperCase()}</kbd>
      </button>
      {open && <Pop which={which} close={() => setOpen(false)} />}
    </div>
  );
}

export function Filters() {
  const log = useAuditLogContext();
  return (
    <div class="audit-filters">
      <Chip which="by" shortcut="p">
        {texts.by}
      </Chip>
      <Chip which="to" shortcut="a">
        {texts.to}
      </Chip>
      <Chip which="dates" shortcut="f">
        {texts.dates}
      </Chip>
      <Chip which="kind" shortcut="t">
        {texts.kind}
      </Chip>
      {hasFilters(log.filters) && (
        <Button
          look="plain"
          size="small"
          icon="x"
          shortcut="x"
          doing={texts.clearFilters}
          onPress={log.clear}
        >
          {texts.clearFilters}
        </Button>
      )}
    </div>
  );
}

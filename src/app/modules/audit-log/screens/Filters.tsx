// Los filtros de la lista (R4.5): hecho por, hecho a, fecha y tipo, que se combinan; cada uno abre su
// lista encima, con su tecla en la computadora. «Sacar los filtros» vuelve a mostrar todo.
import { catalog, type Group, groups } from '@ferrebress/shared/audit-log/index';
import type { AuditPerson } from '@ferrebress/shared/contracts/audit-log';
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { Button } from '../../../ui/button/Button.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { type Filters as Chosen, hasFilters, sortedPeople } from '../logic.ts';
import { useAuditLogContext } from '../state.ts';
import { texts } from '../texts.ts';

type Which = 'by' | 'to' | 'dates' | 'kind';
type Option = {
  label: string;
  detail?: string;
  chosen: boolean;
  pick: () => unknown;
  inner?: boolean;
};

const personLabel = (person: AuditPerson) =>
  person.state === 'deleted'
    ? `${person.name} ${texts.deleted}`
    : person.state === 'deactivated'
      ? `${person.name} ${texts.deactivated}`
      : person.name;

function nameOf(people: AuditPerson[], id: string | undefined): string | undefined {
  if (id === 'system') return texts.system;
  if (id === 'outsider') return texts.outsider;
  return people.find((person) => person.id === id)?.name;
}

// Lo que dice cada filtro cuando está puesto.
function valueOf(which: Which, chosen: Chosen, people: AuditPerson[]): string | undefined {
  if (which === 'by') return nameOf(people, chosen.by);
  if (which === 'to') return nameOf(people, chosen.to);
  if (which === 'dates') {
    const dates = chosen.dates;
    if (!dates) return undefined;
    return 'range' in dates ? texts.ranges[dates.range] : `${dates.from} – ${dates.until}`;
  }
  const kind = chosen.kind;
  if (!kind) return undefined;
  if ('tone' in kind) return kind.tone === 'amber' ? texts.amberKind : texts.redKind;
  if ('group' in kind) return groups[kind.group as Group];
  return catalog[kind.type]?.name;
}

function useOptions(which: Which, close: () => void): Option[] {
  const log = useAuditLogContext();
  const { filters, people } = log;
  const set = (change: Partial<Chosen>) => () => {
    close();
    return log.filter(change);
  };
  if (which === 'by' || which === 'to') {
    const current = filters[which];
    const someone = sortedPeople(people).map((person) => ({
      label: personLabel(person),
      ...(person.email && { detail: person.email }),
      chosen: current === person.id,
      pick: set({ [which]: person.id }),
    }));
    const extra =
      which === 'by'
        ? [
            { label: texts.system, chosen: current === 'system', pick: set({ by: 'system' }) },
            {
              label: texts.outsider,
              chosen: current === 'outsider',
              pick: set({ by: 'outsider' }),
            },
          ]
        : [];
    return [
      { label: texts.all, chosen: !current, pick: set({ [which]: undefined }) },
      ...extra,
      ...someone,
    ];
  }
  if (which === 'dates')
    return [
      { label: texts.allDates, chosen: !filters.dates, pick: set({ dates: undefined }) },
      ...(['today', 'yesterday', 'week', 'month'] as const).map((range) => ({
        label: texts.ranges[range],
        chosen: !!filters.dates && 'range' in filters.dates && filters.dates.range === range,
        pick: set({ dates: { range } }),
      })),
    ];
  const kind = filters.kind;
  const isKind = (key: 'group' | 'type' | 'tone', value: string) =>
    !!kind && key in kind && (kind as Record<string, string>)[key] === value;
  return [
    { label: texts.all, chosen: !kind, pick: set({ kind: undefined }) },
    {
      label: texts.amberKind,
      chosen: isKind('tone', 'amber'),
      pick: set({ kind: { tone: 'amber' } }),
    },
    { label: texts.redKind, chosen: isKind('tone', 'red'), pick: set({ kind: { tone: 'red' } }) },
    ...(Object.keys(groups) as Group[])
      .filter((group) => group !== 'other')
      .flatMap((group) => [
        { label: groups[group], chosen: isKind('group', group), pick: set({ kind: { group } }) },
        ...Object.entries(catalog)
          .filter(([, entry]) => entry.group === group)
          .map(([type, entry]) => ({
            label: entry.name,
            chosen: isKind('type', type),
            pick: set({ kind: { type } }),
            inner: true,
          })),
      ]),
  ];
}

// Elegir los días a mano: desde y hasta.
function PickDates({ close }: { close: () => void }) {
  const log = useAuditLogContext();
  const today = log.page?.today ?? '';
  const [from, setFrom] = useState(today);
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
  const options = useOptions(which, close);
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
              onClick={option.pick}
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
  const [open, setOpen] = useState(false);
  const value = valueOf(which, log.filters, log.people);
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

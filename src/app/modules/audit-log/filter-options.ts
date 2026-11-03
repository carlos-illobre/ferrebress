// Lo que ofrece cada filtro de Quién hizo qué (R4.5) y lo que dice cuando está puesto: las personas
// (también las dadas de baja y las borradas, E30), el sistema y alguien sin entrar, los atajos de
// fecha, y los colores, los grupos y los tipos del catálogo.
import { catalog, type Group, groups } from '@ferrebress/shared/audit-log/index';
import type { AuditPerson } from '@ferrebress/shared/contracts/audit-log';
import { type Filters as Chosen, sortedPeople } from './logic.ts';
import { texts } from './texts.ts';

export type Which = 'by' | 'to' | 'dates' | 'kind';
export type Option = {
  label: string;
  detail?: string;
  chosen: boolean;
  change: Partial<Chosen>;
  inner?: boolean;
};

const marks = { deleted: ` ${texts.deleted}`, deactivated: ` ${texts.deactivated}`, active: '' };
const personLabel = (person: AuditPerson) => `${person.name}${marks[person.state]}`;

function nameOf(people: AuditPerson[], id: string | undefined): string | undefined {
  if (id === 'system') return texts.system;
  if (id === 'outsider') return texts.outsider;
  return people.find((person) => person.id === id)?.name;
}

function kindName(kind: Chosen['kind']): string | undefined {
  if (!kind) return undefined;
  if ('tone' in kind) return kind.tone === 'amber' ? texts.amberKind : texts.redKind;
  if ('group' in kind) return groups[kind.group as Group];
  return catalog[kind.type]?.name;
}

const datesName = (dates: Chosen['dates']) =>
  dates && ('range' in dates ? texts.ranges[dates.range] : `${dates.from} – ${dates.until}`);

// Lo que dice cada filtro cuando está puesto.
export function shownValue(which: Which, chosen: Chosen, people: AuditPerson[]) {
  if (which === 'by' || which === 'to') return nameOf(people, chosen[which]);
  return which === 'dates' ? datesName(chosen.dates) : kindName(chosen.kind);
}

function peopleOptions(which: 'by' | 'to', chosen: Chosen, people: AuditPerson[]): Option[] {
  const current = chosen[which];
  const option = (label: string, value: string | undefined): Option => ({
    label,
    chosen: current === value,
    change: { [which]: value },
  });
  const extra =
    which === 'by' ? [option(texts.system, 'system'), option(texts.outsider, 'outsider')] : [];
  return [
    option(texts.all, undefined),
    ...extra,
    ...sortedPeople(people).map((person) => ({
      ...option(personLabel(person), person.id),
      ...(person.email && { detail: person.email }),
    })),
  ];
}

const dateOptions = (chosen: Chosen): Option[] => [
  { label: texts.allDates, chosen: !chosen.dates, change: { dates: undefined } },
  ...(['today', 'yesterday', 'week', 'month'] as const).map((range) => ({
    label: texts.ranges[range],
    chosen: JSON.stringify(chosen.dates) === JSON.stringify({ range }),
    change: { dates: { range } },
  })),
];

function kindOptions(chosen: Chosen): Option[] {
  const option = (label: string, kind: Chosen['kind'], inner = false): Option => ({
    label,
    chosen: JSON.stringify(chosen.kind) === JSON.stringify(kind),
    change: { kind },
    ...(inner && { inner }),
  });
  const types = (group: Group) =>
    Object.entries(catalog)
      .filter(([, entry]) => entry.group === group)
      .map(([type, entry]) => option(entry.name, { type }, true));
  return [
    option(texts.all, undefined),
    option(texts.amberKind, { tone: 'amber' }),
    option(texts.redKind, { tone: 'red' }),
    ...(Object.keys(groups) as Group[])
      .filter((group) => group !== 'other')
      .flatMap((group) => [option(groups[group], { group }), ...types(group)]),
  ];
}

export function optionsOf(which: Which, chosen: Chosen, people: AuditPerson[]): Option[] {
  if (which === 'by' || which === 'to') return peopleOptions(which, chosen, people);
  return which === 'dates' ? dateOptions(chosen) : kindOptions(chosen);
}

// Lo que muestran la lista, el detalle y la cinta de cada acción: su ícono (R4.10), quién la hizo y
// su texto en trozos, con los nombres de las personas (R4.7). Todo como texto: un nombre
// con algo que parece código de página se ve tal cual (E38). Los datos de personas llevan
// privateProps: «Algo salió mal» no se los lleva.
import type { Piece } from '@ferrebress/shared/audit-log/index';
import type { ActorView, AuditView, TargetView } from '@ferrebress/shared/contracts/audit-log';
import { texts } from '../../../modules/audit-log/model.ts';
import { privateProps } from '../../../platform/view/private.ts';
import { Icon, type IconName } from '../ui/icon/Icon.tsx';

export function ActionIcon({ event, icon }: { event: AuditView; icon: string }) {
  return (
    <span class={`audit-icon audit-${event.tone}`} aria-hidden="true">
      <Icon name={icon as IconName} size="small" />
    </span>
  );
}

// El nombre de una persona, con el de hoy al lado si cambió. Es solo texto: tocarlo es tocar la
// acción, no filtra (para eso están «Hecho por» y «Hecho a»).
export function PersonName({ person }: { person: TargetView }) {
  return (
    <span class="audit-person" {...privateProps()}>
      {person.name ?? person.today ?? ''}
      {person.today && person.name && <small> {texts.today(person.today)}</small>}
    </span>
  );
}

// Quién la hizo: una persona, el sistema o alguien sin entrar (con el correo que usó).
export function Actor({ actor }: { actor: ActorView }) {
  if (actor.kind === 'person') return <PersonName person={actor} />;
  if (actor.kind === 'system') return <span class="audit-actor">{texts.system}</span>;
  return (
    <span class="audit-actor audit-outsider" {...privateProps()}>
      {actor.email ?? texts.outsider}
    </span>
  );
}

// Los trozos del texto (row-lines.ts); `note`: lo que se agrega al final, como la marca de la hora
// del celular en la lista (E09).
export function Said({ said, note }: { said: Piece[]; note?: string | undefined }) {
  return (
    <span class="audit-said">
      {said.map((piece, index) =>
        'text' in piece ? (
          <span key={index}>{piece.text}</span>
        ) : 'thing' in piece ? (
          <b key={index}>{piece.thing}</b>
        ) : (
          <PersonName key={index} person={piece.person} />
        ),
      )}
      {note && <small class="audit-note">{note}</small>}
    </span>
  );
}

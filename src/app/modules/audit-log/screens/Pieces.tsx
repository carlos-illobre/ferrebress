// Lo que muestran la lista, el detalle y la cinta de cada acción: su ícono (R4.10), quién la hizo y
// su texto en trozos, con los nombres de las personas (R4.7). Todo como texto: un nombre
// con algo que parece código de página se ve tal cual (E38). Los datos de personas llevan
// data-private: «Algo salió mal» no se los lleva.
import { entryOf, type Piece } from '@ferrebress/shared/audit-log/index';
import type { ActorView, AuditView, TargetView } from '@ferrebress/shared/contracts/audit-log';
import { Icon, type IconName } from '../../../ui/icon/Icon.tsx';
import { texts } from '../texts.ts';

export function ActionIcon({ event }: { event: AuditView }) {
  return (
    <span class={`audit-icon audit-${event.tone}`} aria-hidden="true">
      <Icon name={entryOf(event.type).icon as IconName} size="small" />
    </span>
  );
}

// El nombre de una persona, con el de hoy al lado si cambió. Es solo texto: tocarlo es tocar la
// acción, no filtra (para eso están «Hecho por» y «Hecho a»).
export function PersonName({ person }: { person: TargetView }) {
  return (
    <span class="audit-person" data-private="">
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
    <span class="audit-actor audit-outsider" data-private="">
      {actor.email ?? texts.outsider}
    </span>
  );
}

// `afterName`: va después de quién lo hizo, así que empieza en minúscula («Ana le sacó…»).
// `note`: lo que se agrega al final, como la marca de la hora del celular en la lista (E09).
export function Said({
  event,
  afterName = false,
  note,
}: {
  event: AuditView;
  afterName?: boolean;
  note?: string | undefined;
}) {
  return (
    <span class="audit-said">
      {entryOf(event.type)
        .says(event)
        .map((piece: Piece, index) =>
          'text' in piece ? (
            <span key={index}>
              {afterName && index === 0
                ? piece.text.charAt(0).toLowerCase() + piece.text.slice(1)
                : piece.text}
            </span>
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

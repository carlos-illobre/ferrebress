// Los atajos de la lista de personas (02 · R2, 00 · R2.8): autorizar a alguien, «Se perdió un
// celular» y, en la tarjeta de la persona elegida, darla de alta, borrar el alta o darla de baja, y
// cerrar todas sus sesiones. Las teclas están en keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { activate, remove } from '../actions.ts';
import { type Foot, footOf } from '../logic.ts';
import type { Users } from '../state.ts';

// La persona elegida, si su tarjeta ofrece eso.
const chosenFor = (users: Users, foot: Foot): PersonRow | false =>
  !!users.person && footOf(users.person, users.may) === foot && users.person;

export const shortcuts = defineShortcuts<Users>('users', {
  authorize: (users) => users.may.authorize && users.online && users.open({ kind: 'authorize' }),
  lost: (users) => users.may.cut && users.online && users.open({ kind: 'lost' }),
  activate: (users) => {
    const person = chosenFor(users, 'activate');
    return !!person && users.online && activate(users, person);
  },
  remove: (users) => {
    const person = chosenFor(users, 'delete');
    return !!person && remove(users, person);
  },
  deactivate: (users) => {
    const person = chosenFor(users, 'deactivate');
    return !!person && users.open({ kind: 'deactivate', person });
  },
  closeAll: (users) =>
    !!users.person &&
    !!users.access?.sessions.length &&
    users.may.cutOver(users.person) &&
    users.open({ kind: 'close-all', person: users.person }),
});

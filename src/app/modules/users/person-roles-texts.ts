// Los textos de los roles de una persona (02 · R7.5), aparte de los de Usuarios: el arranque no los
// trae. Los de la pestaña Roles están en roles/texts.ts.

// Lo que dice al guardar los roles de una persona (R7.5).
export const roleTexts = {
  saved: (name: string) => `Roles de ${name} guardados`,
};

// Los roles de una persona en su tarjeta (R7.5).
export const personRoleTexts = {
  title: (name: string) => `Roles de ${name}`,
  question: (name: string) => `¿Qué puede hacer ${name}?`,
  like: 'Igual que alguien',
  likeWho: 'Copiar los roles de…',
  thatIs: 'Eso es:',
  confirmHint: 'Darle un rol pide confirmar que sos vos',
  saveShort: 'Guardar',
  hint: '· tildá los que tiene',
  willDo: 'Va a poder',
  save: 'Guardar los roles',
  undo: 'Deshacer',
};

// Los textos de la pestaña Roles y de los roles de una persona (02 · R7.3, R7.5), aparte de los de
// Usuarios: el arranque no los trae.

// La pestaña Roles y los roles de una persona (R7.3, R7.5).
export const roleTexts = {
  part: 'Parte',
  includedIn: (name: string) => `Va incluido en «${name}».`,
  roles: 'Roles',
  people: 'Personas',
  whoCan: 'Quién puede qué, sumando sus roles',
  ofPeople: (n: number) => `de ${n} ${n === 1 ? 'persona' : 'personas'}`,
  list: 'Los roles del negocio',
  yours: 'El tuyo',
  nobody: 'Nadie',
  holders: (n: number) => (n === 1 ? 'persona' : 'personas'),
  summary: (permissions: number, people: number) =>
    `${permissions} ${permissions === 1 ? 'permiso' : 'permisos'} · Lo ${people === 1 ? 'tiene' : 'tienen'} ${people} ${people === 1 ? 'persona' : 'personas'}`,
  whatItDoes: 'Qué deja hacer',
  editName: 'Cambiar el nombre del rol',
  namePlaceholder: 'Nombre del rol',
  editDescription: 'Cambiar la descripción',
  descriptionPlaceholder: 'Para qué es (puede quedar vacía)',
  noDescription: 'Sin descripción',
  whoHasIt: 'Quiénes lo tienen',
  give: 'Darle este rol',
  giveTo: 'Darle este rol a…',
  take: 'Sacárselo',
  onlyRole: 'Es su único rol: para que no pueda nada, dala de baja.',
  duplicate: 'Duplicar',
  copyOf: (name: string) => `${name} (copia)`,
  remove: 'Borrar el rol',
  removeHint: 'Solo se borra un rol que nadie tiene.',
  newRole: 'Nuevo rol',
  newTitle: 'Rol nuevo',
  create: 'Crear el rol',
  cancel: 'Cancelar',
  name: 'Nombre',
  description: 'Descripción',
  noPermissions: 'Tildá al menos un permiso.',
  noName: 'Ponele un nombre.',
  choose: 'Elegí un rol para ver qué deja hacer.',
  loading: 'Buscando los roles',
  saved: (name: string) => `Roles de ${name} guardados`,
  created: (name: string) => `Rol «${name}» creado`,
  changed: 'Rol guardado',
  deleted: (name: string) => `Rol «${name}» borrado`,
};

// Los roles de una persona en su tarjeta (R7.5).
export const personRoleTexts = {
  title: (name: string) => `Roles de ${name}`,
  hint: '· tildá los que tiene',
  willDo: 'Va a poder',
  save: 'Guardar los roles',
  undo: 'Deshacer',
};

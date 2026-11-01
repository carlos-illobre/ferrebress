// Los textos de la pestaña Roles (02 · R7.12, R7.13; maqueta users-roles/final), aparte de los de
// Usuarios: el arranque no los trae. Iguales en la computadora y en el celular.

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const rolesTexts = {
  // La lista (R7.12).
  list: 'Los roles del negocio',
  search: 'Buscá un rol, un permiso o una persona',
  searchShort: 'Buscá un rol',
  clear: 'Borrar la búsqueda',
  newRole: 'Nuevo rol',
  nothing: (query: string) => `No hay ningún rol con «${query}».`,
  createNamed: (query: string) => `Crear el rol «${query}»`,
  permissions: (n: number) => plural(n, 'permiso', 'permisos'),
  permissionsWord: (n: number) => (n === 1 ? 'permiso' : 'permisos'),
  holders: (n: number) => (n === 1 ? 'Lo tiene 1 persona' : `Lo tienen ${n} personas`),
  peopleWord: (n: number) => (n === 1 ? 'persona' : 'personas'),
  nobody: 'Nadie lo tiene',
  loading: 'Trayendo los roles…',
  loadFailed: 'No se pudieron traer los roles.',
  retry: 'Reintentar',
  open: (name: string) => `Abrir «${name}»`,

  // La pantalla del rol (R7.13).
  back: 'Roles',
  backLabel: 'Volver a los roles',
  crumbs: 'Dónde estás',
  newCrumb: 'Crear rol',
  newTitle: 'Crear nuevo rol',
  lead: 'Definí el nombre, la descripción y los permisos de este rol.',
  duplicate: 'Duplicar',
  remove: 'Borrar el rol',
  cancel: 'Cancelar',
  save: 'Guardar rol',
  create: 'Crear el rol',
  info: 'Información del rol',
  name: 'Nombre del rol',
  description: 'Descripción',
  descriptionHint: '(para quién es; puede quedar vacía)',
  namePlaceholder: 'Por ejemplo, Encargado de turno',
  descriptionPlaceholder: 'Por ejemplo, abre y cierra el local y cobra',
  count: (n: number, max: number) => `${n}/${max}`,
  assign: 'Asignar permisos',
  assignLead:
    'Seleccioná los permisos que tendrá este rol. Al guardar, valen para todos los que lo tienen.',
  ofTotal: (n: number, total: number) => `${n} de ${total}`,
  tiedLong: (names: string[], many: boolean) =>
    `Va incluido en ${names.join(' y ')}: se destilda solo si sacás ${many ? 'esos' : 'ese'}.`,
  tiedShort: (names: string[]) => `Lo incluye ${names.join(' y ')}.`,
  who: 'Quiénes lo tienen',
  whoLead: 'Dale este rol a las personas que lo necesiten, o sacáselo.',
  giveTo: 'Darle este rol a…',
  take: 'Sacárselo',
  undo: 'Deshacer',
  willGet: 'Lo va a tener al guardar',
  willLose: 'Se lo saca al guardar',
  alsoInactive: (names: string) => `También lo tienen, dadas de baja: ${names}.`,
  nobodyYet: 'Todavía nadie lo tiene.',
  pick: 'Darle este rol a…',
  pickSearch: 'Buscá por nombre o correo',
  pickNone: 'No hay nadie más para darle este rol.',
  close: 'Cerrar',
  preview: 'Vista previa del rol',
  previewLead: 'Así va a quedar cuando lo guardes.',
  noPermissions: 'Sin permisos',
  editLater: 'Podés cambiar este rol cuando quieras desde la lista de roles.',
  systemNote: 'El Administrador recibe solo cada permiso nuevo y no se borra.',
  offlineSave: 'Sin conexión: se guarda cuando vuelva.',

  // Lo que no se puede guardar (R7.3, R7.5, E56, E65).
  problems: 'No se guardó nada. Revisá lo marcado:',
  noName: 'Ponele un nombre.',
  nameTaken: 'Ya hay un rol con ese nombre (sin importar mayúsculas).',
  noPermissionsError: 'Tildá al menos un permiso.',
  lastRole: (name: string) =>
    `${name} se quedaría sin roles: para que no pueda nada, dala de baja.`,
  inactive: (name: string) => `${name} está dada de baja: no se le puede dar el rol.`,
  missing: 'Una de las personas ya no está: la borraron mientras armabas el rol.',
  self: (permission: string) =>
    `Te sacarías «${permission}»: eso te lo tiene que hacer otra persona.`,
  changedOver:
    'Otra persona cambió este rol mientras lo armabas: tus cambios quedaron encima de lo nuevo. Revisalos y guardá.',

  // Salir sin guardar (E64).
  discardTitle: '¿Descartar los cambios del rol?',
  discardLead: 'Lo que cambiaste en este rol todavía no se guardó.',
  keepEditing: 'Seguir editando',
  discard: 'Descartar',

  // Confirmar quién es (R3.8): qué da lo que se guarda.
  givesRole: (role: string, names: string) => `Le das «${role}» a ${names}.`,
  givesPermission: (role: string, permissions: string) => `Le sumás a «${role}»: ${permissions}.`,
  createsRole: (role: string) => `Creás el rol «${role}».`,

  // Lo que dice al terminar.
  created: (name: string) => `Se creó el rol «${name}».`,
  saved: (name: string) => `Se guardó «${name}».`,
  removed: (name: string) => `Se borró el rol «${name}».`,
  copied: (name: string) => `Copia de «${name}»: cambiale el nombre y guardala.`,
  inUse: 'Alguien tiene este rol: primero sacáselo a esas personas.',
};

// Los textos de la pestaña Roles (02 · R7.12, R7.13; maqueta users-roles/final), aparte de los de
// Usuarios: el arranque no los trae. Iguales en la computadora y en el celular.

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const rolesTexts = {
  // La lista (R7.12).
  list: 'Los roles del negocio',
  search: 'Buscá un rol, un permiso o una persona',
  searchShort: 'Buscá un rol',
  newRole: 'Nuevo rol',
  nothing: (query: string) => `Ningún rol coincide con «${query}».`,
  nothingHint: 'Se busca por el nombre o la descripción del rol, sus permisos y quienes lo tienen.',
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
  willGet: 'Se lo das al guardar',
  willLose: 'Se lo sacás al guardar',
  you: 'Vos',
  alsoInactive: (names: string) => `También lo tienen, dadas de baja: ${names}.`,
  nobodyYet: 'Nadie lo tiene todavía. Dáselo a alguien, o guardalo y asignalo después.',
  pick: 'Darle este rol a…',
  pickSearch: 'Buscá por nombre o correo',
  pickNone: 'No hay nadie más para darle este rol.',
  close: 'Cerrar',
  preview: 'Vista previa del rol',
  previewLead: 'Así va a quedar cuando lo guardes.',
  previewLeadNew: 'Así se verá este rol una vez creado.',
  noPermissions: 'Sin permisos',
  editLater: 'Podés cambiar este rol cuando quieras desde la lista de roles.',
  offlineSave: 'Sin conexión: se guarda cuando vuelva.',

  // Lo que no se puede guardar (R7.3, R7.5, E56, E65).
  problems: (which: string) => `No se guardó nada. Corregí lo que está marcado en rojo: ${which}.`,
  theName: 'el nombre',
  thePermissions: 'los permisos',
  yourRole: 'tu rol',
  someoneGone: 'una persona que ya no está',
  tooMany: (name: string) => `${name} ya tiene 50 roles: sacale alguno antes de darle otro.`,
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
  discardLead: (name: string) =>
    `Lo que cambiaste en «${name}» no se guardó. Si descartás, queda como estaba.`,
  discardLeadNew: 'El rol nuevo todavía no se creó. Si descartás, no queda nada.',
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
  inUse: (names: string[]) =>
    `No se puede borrar: lo ${names.length > 1 ? 'tienen' : 'tiene'} ${names.join(', ')}. Primero hay que sacárselo.`,
  inactiveMark: (name: string) => `${name} (dada de baja)`,
};

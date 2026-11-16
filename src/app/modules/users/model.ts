// Lo que las vistas usan de este módulo (ADR-019): sus modelos, sus textos y las cuentas que
// muestran. Las vistas no importan nada más del módulo; index.ts es lo que va en el arranque.

// Los íconos de cada permiso y de cada grupo, que son del marco.
export { groupIcons, permissionIcons } from '../frame/index.ts';
export {
  activate,
  authorize,
  change,
  closeAll,
  closeSession,
  deactivate,
  remove,
  removePhone,
} from './actions.ts';
export { type EditableModel, useEditable } from './editable.ts';
export {
  counts,
  dateOf,
  deviceOf,
  type Filter,
  footOf,
  holdersOf,
  initialsOf,
  nowMs,
  sinceOf,
  wayNames,
} from './logic.ts';
export { type Owner, useLost } from './lost.ts';
export { saveRoles } from './person-roles.ts';
export { useAuthorize, usePersonRoles } from './person-roles-model.ts';
export { personRoleTexts } from './person-roles-texts.ts';
export { refusalText, refused } from './refusals.ts';
export { removeRole, type SaveOutcome, saveDraft } from './roles/actions.ts';
export {
  type Draft,
  type DraftErrors,
  duplicateOf,
  emptyDraft,
  fromRole,
  give,
  givesAccess,
  hasErrors,
  holdersOf as roleHoldersOf,
  isDirty,
  type PersonError,
  reapply,
  take,
  tiedBy,
  toggle,
  undo,
  validate,
} from './roles/draft.ts';
export { whatItGives } from './roles/gives.ts';
export { activeHolders, ids, listPath, type NewState, newPath, rolePath } from './roles/paths.ts';
export { filterRoles, searchIndex } from './roles/search.ts';
export { rolesTexts } from './roles/texts.ts';
export { type RoleScreenModel, useRoleScreen } from './roles/useRole.ts';
export {
  type RoleListModel,
  useNewRole,
  useOpenedRole,
  useRoleList,
  useRolesTab,
} from './roles/useRoles.ts';
export { type Users, UsersContext, useUsers, useUsersContext } from './state.ts';
export { cardTexts, dialogTexts, refusalTexts, somethingFailed, texts } from './texts.ts';

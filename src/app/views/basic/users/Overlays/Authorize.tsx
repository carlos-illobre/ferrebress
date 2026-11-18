// Autorizar a alguien (R3.3): su correo de Google, su nombre, que puede quedar vacío, y sus roles,
// ninguno tildado de antemano (E42). Un correo sin forma de correo o ya cargado se dice junto al
// campo, sin perder lo escrito; sin ningún rol, junto a los roles.

import { refusalTexts, dialogTexts as t, useAuthorize } from '../../../../modules/users/model.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Dialog } from '../../ui/dialog/Dialog.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import { RolePicker } from '../PersonRoles/RolePicker.tsx';
import './Overlays.css';
import { privateProps } from '../../../../platform/view/private.ts';

// Sus roles: ninguno tildado de antemano (E42); sin ninguno, se dice acá.
type Form = ReturnType<typeof useAuthorize>;

function RolesField({ form }: { form: Form }) {
  return (
    <div class="users-field users-authorize-roles">
      <span>{t.authorizeRoles}</span>
      <RolePicker picks={form.picks} label={t.authorizeRoles} toggle={form.toggleRole} />
      {form.noRoles && (
        <small class="users-field-error" role="alert">
          <Icon name="triangle-alert" size="small" />
          {refusalTexts['no-roles']}
        </small>
      )}
    </div>
  );
}

// Su correo de Google: lo que no se puede usar se dice debajo, sin perder lo escrito (R3.3).
function EmailField(props: {
  email: string;
  error: string | undefined;
  max: number;
  onInput: (value: string) => void;
}) {
  return (
    <label
      class={props.error ? 'users-field users-field-email wrong' : 'users-field users-field-email'}
    >
      <span>{t.email}</span>
      <input
        type="email"
        inputMode="email"
        value={props.email}
        placeholder={t.emailPlaceholder}
        autocomplete="off"
        maxLength={props.max}
        data-autofocus=""
        aria-invalid={!!props.error}
        onInput={(event) => props.onInput(event.currentTarget.value)}
      />
      {props.error && (
        <small class="users-field-error" role="alert">
          <Icon name="triangle-alert" size="small" />
          {props.error}
        </small>
      )}
    </label>
  );
}

export function Authorize() {
  const form = useAuthorize();
  return (
    <Dialog label={t.authorizeTitle} className="users-dialog users-authorize">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.send();
        }}
        noValidate
      >
        <h2>{t.authorizeTitle}</h2>
        <p class="users-lead">{t.authorizeLead}</p>
        <EmailField
          email={form.email}
          error={form.error}
          max={form.limits.email}
          onInput={form.typeEmail}
        />
        <label class="users-field users-field-name" {...privateProps()}>
          <span>{t.name}</span>
          <input
            value={form.name}
            autocomplete="off"
            maxLength={form.limits.name}
            onInput={(event) => form.typeName(event.currentTarget.value)}
          />
          <small>{t.nameHint}</small>
        </label>
        <RolesField form={form} />
        <div class="users-dialog-foot">
          <Button look="plain" doing={t.cancel} onPress={form.close} closes>
            {t.cancel}
          </Button>
          <Button
            look="action"
            icon="user-check"
            doing={t.authorizeYes}
            onPress={form.send}
            primary
          >
            {t.authorizeYes}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// Autorizar a alguien (R3.3): su nombre, que puede quedar vacío, su correo de Google y sus roles,
// ninguno tildado de antemano (E42). Un correo sin forma de correo o ya cargado se dice junto al
// campo, sin perder lo escrito; sin ningún rol, junto a los roles.
import { useState } from 'preact/hooks';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { authorize } from '../../actions.ts';
import { useUsersContext } from '../../state.ts';
import { refusalTexts, dialogTexts as t } from '../../texts.ts';
import { RolePicker } from '../Roles/RolePicker.tsx';
import './Overlays.css';

const looksLikeEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());

// Sus roles: ninguno tildado de antemano (E42); sin ninguno, se dice acá.
function RolesField(props: {
  chosen: string[];
  missing: boolean;
  onChange: (next: string[]) => void;
}) {
  const users = useUsersContext();
  return (
    <div class="users-field users-authorize-roles">
      <span>{t.authorizeRoles}</span>
      <RolePicker
        roles={users.roles}
        chosen={props.chosen}
        label={t.authorizeRoles}
        onChange={props.onChange}
      />
      {props.missing && (
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
        maxLength={254}
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
  const users = useUsersContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [roles, setRoles] = useState<string[]>([]);
  const [noRoles, setNoRoles] = useState(false);
  const send = async () => {
    if (!looksLikeEmail(email)) return setError(refusalTexts['bad-request']);
    if (roles.length === 0) return setNoRoles(true);
    const refused = await authorize(users, { name, email, roles }, send);
    if (refused) setError(refusalTexts[refused]);
  };
  return (
    <Dialog label={t.authorizeTitle} className="users-dialog users-authorize">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        noValidate
      >
        <h2>{t.authorizeTitle}</h2>
        <p class="users-lead">{t.authorizeLead}</p>
        <label class="users-field users-field-name" data-private="">
          <span>{t.name}</span>
          <input
            value={name}
            autocomplete="off"
            maxLength={80}
            data-autofocus=""
            onInput={(event) => setName(event.currentTarget.value)}
          />
          <small>{t.nameHint}</small>
        </label>
        <EmailField
          email={email}
          error={error}
          onInput={(value) => {
            setEmail(value);
            setError(undefined);
          }}
        />
        <RolesField
          chosen={roles}
          missing={noRoles}
          onChange={(next) => {
            setRoles(next);
            setNoRoles(false);
          }}
        />
        <div class="users-dialog-foot">
          <Button look="plain" doing={t.cancel} onPress={users.close} closes>
            {t.cancel}
          </Button>
          <Button look="action" icon="user-check" doing={t.authorizeYes} onPress={send} primary>
            {t.authorizeYes}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

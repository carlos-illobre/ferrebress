// Autorizar a alguien (R3.3): su nombre, que puede quedar vacío, y su correo de Google. Un correo
// sin forma de correo o ya cargado se dice junto al campo, sin perder lo escrito.
import { useState } from 'preact/hooks';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { authorize } from '../../actions.ts';
import { useUsersContext } from '../../state.ts';
import { refusalTexts, dialogTexts as t } from '../../texts.ts';
import './Overlays.css';

const looksLikeEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());

export function Authorize() {
  const users = useUsersContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const send = async () => {
    if (!looksLikeEmail(email)) return setError(refusalTexts['bad-request']);
    const refused = await authorize(users, name, email, send);
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
        <label
          class={error ? 'users-field users-field-email wrong' : 'users-field users-field-email'}
        >
          <span>{t.email}</span>
          <input
            type="email"
            inputMode="email"
            value={email}
            placeholder={t.emailPlaceholder}
            autocomplete="off"
            maxLength={254}
            aria-invalid={!!error}
            onInput={(event) => {
              setEmail(event.currentTarget.value);
              setError(undefined);
            }}
          />
          {error && (
            <small class="users-field-error" role="alert">
              <Icon name="triangle-alert" size="small" />
              {error}
            </small>
          )}
        </label>
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

// Las hojas del marco en el celular: Más (la persona, las opciones y «Salir») y lo pendiente. Suben
// desde abajo, por encima del menú, que queda a la vista; deslizarlas hacia abajo las cierra.
import { navigate } from '../../../../platform/router.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { Sheet } from '../../../../ui/sheet/Sheet.tsx';
import { initials, useFrame } from '../../context.ts';
import { exists, moreOptions, shown } from '../../menu.ts';
import { texts } from '../../texts.ts';
import { Pending } from '../Pending/Pending.tsx';

export function PhoneSheets() {
  const { panels } = useFrame();
  if (panels.open === 'phonePending')
    return (
      <Sheet title={texts.pending.title} onClose={panels.close} className="frame-sheet">
        <Pending />
      </Sheet>
    );
  if (panels.open === 'phoneMore') return <MoreSheet />;
  return null;
}

function MoreSheet() {
  const { person, panels, testing, notYet, signOut } = useFrame();
  return (
    <Sheet title={texts.more} onClose={panels.close} className="frame-sheet">
      <div class="sheet-person">
        <span class="avatar">{initials(person.name)}</span>
        <div>
          <b>{person.name}</b>
          <small>{person.role}</small>
        </div>
      </div>
      <ul class="sheet-options">
        {shown(moreOptions, testing).map((option) => (
          <li key={option.id}>
            <button
              type="button"
              class="sheet-option"
              onClick={(event) =>
                option.path ? navigate(option.path) : notYet(event.currentTarget, option.name)
              }
            >
              <span class="sheet-option-icon">
                <Icon name={option.icon} />
              </span>
              <span class="sheet-option-name">{option.name}</span>
              {!exists(option) && <span class="coming-soon">{texts.comingSoon}</span>}
            </button>
          </li>
        ))}
      </ul>
      <Button doing={texts.signingOut} onPress={signOut} look="danger" size="large" icon="log-out">
        {texts.signOut.short}
      </Button>
    </Sheet>
  );
}

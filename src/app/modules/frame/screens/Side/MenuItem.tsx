// Un renglón del menú de la computadora: su ícono, su nombre, «Pronto» si todavía no existe y su
// tecla. Minimizado, el nombre queda para el lector de pantalla y lo dice el rótulo.
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { useFrame } from '../../context.ts';
import { exists, type Option, openOption, unavailable } from '../../menu.ts';
import { texts } from '../../texts.ts';

export function MenuItem({ option }: { option: Option }) {
  const frame = useFrame();
  const soon = !exists(option);
  const off = unavailable(option, frame.online);
  return (
    <button
      type="button"
      class={soon ? 'part' : 'part opens'}
      disabled={off}
      data-mark=""
      data-key={option.shortcut}
      data-name={option.name}
      data-detail={soon ? texts.comingSoon : off ? texts.offlineOption : undefined}
      aria-current={frame.current === option.id ? 'page' : undefined}
      onClick={(event) =>
        option.path
          ? openOption(option, frame.current)
          : frame.notYet(event.currentTarget, option.name)
      }
      onPointerEnter={(event) =>
        event.pointerType !== 'touch' && frame.tip.label(event.currentTarget)
      }
      onPointerLeave={frame.tip.hide}
    >
      <Icon name={option.icon} />
      <span class="part-name">{option.name}</span>
      {soon && <span class="coming-soon">{texts.comingSoon}</span>}
      {off && <span class="coming-soon">{texts.offlineOption}</span>}
      {soon && (
        <span class="coming-soon-mini" aria-hidden="true">
          <Icon name="clock" />
        </span>
      )}
      <kbd>{option.shortcut.toUpperCase()}</kbd>
    </button>
  );
}

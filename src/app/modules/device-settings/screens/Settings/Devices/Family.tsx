// Otro dispositivo propio (04 · R1.8, R6 a R8): su sesión y su huella como fichas con su ×, y colgadas,
// las computadoras que hizo entrar con su código. Al apuntar «Se me perdió» o la × de la huella, lo que
// se corta se pone rojo (lo hace el CSS); en el celular, mientras el dedo está apoyado, y se corta al
// soltarlo si no se movió.
import type { MyComputer, MyDevice } from '@ferrebress/shared/contracts/device-settings';
import { useRef, useState } from 'preact/hooks';
import { isPhone } from '../../../../../platform/device/device.ts';
import { dateOf, nowMs, sinceOf } from '../../../../../platform/time.ts';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { lastUseOf, nameOf } from '../../../mine/rules.ts';
import { mineTexts as t } from '../../../mine/texts.ts';
import type { Mine } from '../../../mine/useMine.ts';

const iconOf = (device: { isPhone?: boolean }) => (device.isPhone ? 'smartphone' : 'monitor');
const usedLine = (lastUsedAt: number, now: number) =>
  now - lastUsedAt < 5 * 60_000 ? t.usedNow : t.used(sinceOf(lastUsedAt, now));

function X({ label, act, kind }: { label: string; act: () => unknown; kind?: string }) {
  return (
    <button
      type="button"
      class={`mine-x ${kind ?? ''}`}
      data-mark=""
      aria-label={label}
      title={label}
      onClick={() => void act()}
    >
      <Icon name="x" size="small" />
    </button>
  );
}

export function Computers({
  computers,
  here,
  mine,
}: {
  computers: MyComputer[];
  here: boolean;
  mine: Mine;
}) {
  if (computers.length === 0) return null;
  const now = nowMs();
  return (
    <div class="mine-children">
      <div class="mine-children-title">
        <Icon name="qr-code" size="small" />
        {here ? t.computers.here : t.computers.other}
      </div>
      {computers.map((computer) => (
        <div key={computer.session.id} class="mine-child mine-goes">
          <span class="mine-child-icon">
            <Icon name="monitor" size="small" />
          </span>
          <span class="mine-child-text">
            <b>{nameOf(computer)}</b>
            <span>
              {t.entered(sinceOf(computer.session.createdAt, now))} ·{' '}
              {usedLine(computer.session.lastUsedAt, now)}
            </span>
          </span>
          <span class="mine-goes-tag">{t.goes.session}</span>
          <X
            label={t.close(nameOf(computer))}
            act={() => mine.closeSession(computer.session.id, nameOf(computer))}
          />
        </div>
      ))}
    </div>
  );
}

function Chips({ device, mine }: { device: MyDevice; mine: Mine }) {
  const now = nowMs();
  const { session, passkey } = device;
  return (
    <div class="mine-chips">
      {session && (
        <span class="mine-chip mine-goes">
          <span class="mine-dot" />
          <span>
            {now - session.lastUsedAt < 5 * 60_000
              ? t.sessionNow
              : t.sessionOpen(sinceOf(session.lastUsedAt, now))}
          </span>
          <span class="mine-chip-detail">
            {t.sessionHow(t.ways[session.way], sinceOf(session.createdAt, now))}
          </span>
          <span class="mine-goes-tag">{t.goes.session}</span>
          <X
            label={t.close(nameOf(device))}
            act={() => mine.closeSession(session.id, nameOf(device))}
          />
        </span>
      )}
      {passkey && (
        <span class="mine-chip mine-goes">
          <Icon name="fingerprint" size="small" />
          <span>{t.passkeySince(dateOf(passkey.createdAt, now))}</span>
          <span class="mine-chip-detail">{lastUseOf(passkey.lastUsedAt, now)}</span>
          <span class="mine-goes-tag">{t.goes.passkey}</span>
          <X
            label={t.removeOf(nameOf(device))}
            kind="mine-aims"
            act={() => mine.cut(device, 'remove')}
          />
        </span>
      )}
    </div>
  );
}

// «Se me perdió»: de un toque y sin confirmación (R8.1). En el celular, se corta al soltar el dedo,
// salvo que se haya movido (un desplazamiento no corta nada).
function Lost({ cut }: { cut: () => unknown }) {
  // local: el dedo apoyado es de este celular.
  const [pressing, setPressing] = useState(false);
  const start = useRef<{ x: number; y: number } | undefined>(undefined);
  const phone = isPhone();
  const moved = (event: PointerEvent) =>
    !start.current ||
    Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > 10;
  return (
    <button
      type="button"
      class={`button button-red button-small mine-lost mine-aims${pressing ? ' pressing' : ''}`}
      data-mark=""
      onClick={() => !phone && void cut()}
      onPointerDown={(event) => {
        if (!phone) return;
        start.current = { x: event.clientX, y: event.clientY };
        setPressing(true);
      }}
      onPointerMove={(event) => pressing && moved(event) && setPressing(false)}
      onPointerCancel={() => setPressing(false)}
      onPointerUp={(event) => {
        if (pressing && !moved(event)) void cut();
        setPressing(false);
      }}
    >
      <Icon name="scissors" size="small" />
      {t.lost}
    </button>
  );
}

export function Family({ device, mine }: { device: MyDevice; mine: Mine }) {
  return (
    <article class="surface mine-family">
      <div class="mine-family-head">
        <span class="mine-family-icon">
          <Icon name={iconOf(device)} />
        </span>
        <div class="mine-family-text">
          <h3>{nameOf(device)}</h3>
          <span>{device.name ? device.label : t.noName}</span>
        </div>
        {device.isPhone && <Lost cut={() => mine.cut(device, 'lost')} />}
      </div>
      <Chips device={device} mine={mine} />
      <Computers computers={device.computers} here={false} mine={mine} />
    </article>
  );
}

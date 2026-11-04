// La ruta dibujada (R4.2): este dispositivo, el medio por el que se hablan y el otro, con la latencia
// por el directo (`getStats()`, leída cada 2 s solo con el detalle abierto) o por el servidor.
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../../../../platform/store.ts';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { linkRuntime } from '../../current.ts';
import type { Status } from '../../texts.ts';
import type { LinkView } from '../../view.ts';
import { detailTexts } from './texts.ts';

const medium: Record<Status, IconName> = {
  unpaired: 'plus',
  direct: 'wifi',
  relayed: 'cloud',
  paused: 'unplug',
  waiting: 'clock',
  offline: 'wifi-off',
};

function useRoundTrip(on: boolean): number | undefined {
  const runtime = useStore(linkRuntime);
  const [ms, setMs] = useState<number>();
  useEffect(() => {
    if (!on || !runtime) return setMs(undefined);
    const read = () => void runtime.roundTripMs().then((value) => setMs(value));
    read();
    const timer = setInterval(read, 2000);
    return () => clearInterval(timer);
  }, [on, runtime]);
  return ms;
}

export function Route({ view, phone }: { view: LinkView; phone: boolean }) {
  const roundTrip = useRoundTrip(view.status === 'direct');
  const side = phone ? 'phone' : 'computer';
  const other = view.status === 'unpaired' ? detailTexts.detail.noOther[side] : view.other;
  return (
    <div class="route-box">
      <div class="route" data-status={view.status} aria-hidden="true">
        <div class="route-node">
          <span class="route-icon">
            <Icon name={phone ? 'smartphone' : 'monitor'} size="large" />
          </span>
          <small>{detailTexts.detail.here[side]}</small>
        </div>
        <div class="route-span">
          {roundTrip !== undefined && <span class="route-latency">{Math.round(roundTrip)} ms</span>}
          <span class="route-cable" />
          <span class="route-medium">
            <Icon name={medium[view.status]} />
          </span>
        </div>
        <div class="route-node">
          <span class="route-icon">
            <Icon name={phone ? 'monitor' : 'smartphone'} size="large" />
          </span>
          <small>{other}</small>
        </div>
      </div>
    </div>
  );
}

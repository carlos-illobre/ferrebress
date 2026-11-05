// Los datos del vínculo (R4.2): con qué está vinculado, desde cuándo y hasta cuándo dura sin usarse,
// con la barra de los días que quedan.
import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { day, detailTexts, since } from './texts.ts';

const dayMs = 86_400_000;

export function Facts({ pairing, now }: { pairing: PairingView; now: number }) {
  const t = detailTexts.detail;
  const left = Math.max(0, Math.ceil((pairing.expiresAt - now) / dayMs));
  const share = `${Math.min(100, (left / pairing.lastsDays) * 100)}%`;
  return (
    <dl class="facts">
      <div class="facts-row">
        <Icon name={pairing.side === 'phone' ? 'monitor' : 'smartphone'} />
        <dt>{t.pairedWith}</dt>
        <dd>
          {pairing.other.label}{' '}
          <span class="facts-since">· {t.since(since(pairing.since, now))}</span>
        </dd>
      </div>
      <div class="facts-row">
        <Icon name="timer" />
        <dt>{t.lasts}</dt>
        <dd class="facts-lasts">
          {t.until(day(pairing.expiresAt))}
          <span class="facts-bar">
            <span class="bar">
              <b style={{ width: share }} />
            </span>
            <small>{t.daysLeft(left, pairing.lastsDays)}</small>
          </span>
        </dd>
      </div>
    </dl>
  );
}

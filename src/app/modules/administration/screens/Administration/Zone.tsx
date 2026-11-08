// El panel de la zona horaria (R5): se ve, con la hora del negocio, y no se toca.
import { groupOf, texts } from '../../texts.ts';
import type { Administration } from '../../useAdministration.ts';
import { Heading } from './Heading.tsx';

export function ZonePanel({ view, clock }: { view: Administration; clock: string }) {
  const t = texts.zone;
  const zone = (view.data as { businessTimeZone: string }).businessTimeZone;
  return (
    <>
      <Heading group={groupOf.zone} icon="globe" title={t.title} subtitle={t.subtitle} locked />
      <div class="admin-clock">
        <span class="admin-detail">{t.nowIn}</span>
        <b class="admin-clock-time">{clock}</b>
        <span>{zone.split('/').at(-1)?.replace(/_/g, ' ')}</span>
        <p class="admin-detail">{t.says}</p>
        <span class="admin-locked">{t.locked}</span>
      </div>
    </>
  );
}

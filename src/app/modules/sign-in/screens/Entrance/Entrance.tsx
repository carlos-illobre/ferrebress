// La entrada (capítulo 01, R7.1): una sola pantalla que se adapta al ancho, desde su maqueta
// aprobada (docs/design/mockups/sign-in/adapted/). Se ve sin sesión, y encima de lo que había si
// la sesión se cerró (R3.4).
import type { StartResponse } from '@ferrebress/shared/contracts/sign-in';
import { online as onlineStore, sessionClosed } from '../../../../platform/api.ts';
import { useStore } from '../../../../platform/store.ts';
import { useWaiting } from '../../../../platform/waiting.ts';
import { TestEnvironment } from '../../../frame/index.ts';
import { useNotice } from '../../notice.ts';
import { texts } from '../../texts.ts';
import { Card } from './Card.tsx';
import { EntranceContext, type EntranceState } from './context.ts';
import { Brand, PhoneShot, Seals, Status, WaitingSign, Wave, WhatFor } from './Scene.tsx';
import './Entrance.css';
import './desktop.css';
import './desktop-code.css';
import './desktop-end.css';
import './phone.css';
import './phone-buttons.css';

export type EntranceProps = { start: StartResponse; onScan: () => void; signInFirst: boolean };

export function Entrance({ start, onScan, signInFirst }: EntranceProps) {
  const online = useStore(onlineStore);
  const closed = useStore(sessionClosed);
  const { notice, setNotice } = useNotice();
  const { phase, run } = useWaiting();
  const state: EntranceState = {
    start,
    online,
    notice,
    closed,
    attempt: (task) => void run(texts.signingIn, task).then((next) => setNotice(next)),
    busy: phase === 'mark' || phase === 'bar',
    scan: onScan,
    signInFirst,
  };
  return (
    <EntranceContext.Provider value={state}>
      {start.environment !== 'production' && <TestEnvironment />}
      <main class={online ? 'sign-in' : 'sign-in offline'} data-layer="">
        <div class="scene">
          <div class="scene-background" aria-hidden="true" />
          <Brand />
          <PhoneShot />
          <Status />
          <div class="right">
            <Card />
            <Seals />
          </div>
          <WhatFor />
          <Wave />
        </div>
      </main>
      {state.busy && <WaitingSign />}
    </EntranceContext.Provider>
  );
}

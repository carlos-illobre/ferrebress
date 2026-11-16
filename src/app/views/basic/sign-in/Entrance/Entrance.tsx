// La entrada (capítulo 01, R7.1): una sola pantalla que se adapta al ancho, desde su maqueta
// aprobada (docs/design/mockups/sign-in/adapted/). Se ve sin sesión, y encima de lo que había si
// la sesión se cerró (R3.4).
import { TestEnvironment } from '../../../../modules/frame/index.ts';
import {
  EntranceContext,
  type EntranceProps,
  texts,
  useEntranceModel,
} from '../../../../modules/sign-in/model.ts';
import { Card } from './Card.tsx';
import { Entering } from './entering/Entering.tsx';
import { Brand, PhoneShot, Seals, Status, Wave, WhatFor } from './scene/Scene.tsx';
import './styles/Entrance.css';
import './styles/desktop.css';
import './qr/qr.css';
import './styles/desktop-end.css';
import './styles/phone.css';
import './styles/phone-buttons.css';
import './styles/phone-dark.css';
import './styles/phone-dark-ways.css';

export function Entrance(props: EntranceProps) {
  const model = useEntranceModel(props);
  const { state, phone, way } = model;
  const { start, online } = state;
  return (
    <EntranceContext.Provider value={model}>
      {start.environment !== 'production' && <TestEnvironment />}
      <main
        class={online ? 'sign-in' : 'sign-in offline'}
        data-device={phone ? 'phone' : 'computer'}
        data-layer=""
      >
        <div class="scene">
          <div class="scene-background" aria-hidden="true" />
          <Brand phone={phone} />
          <PhoneShot />
          <Status />
          <div class="right">
            <Card />
            <Seals />
          </div>
          {phone ? (
            <p class="no-account">{texts.noAccount}</p>
          ) : (
            <>
              <WhatFor />
              <Wave />
            </>
          )}
        </div>
      </main>
      {way && <Entering way={way} where="screen" />}
    </EntranceContext.Provider>
  );
}

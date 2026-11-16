// El lugar del aviso para instalar, que App pone sobre el marco: la hoja se baja recién cuando toca.

import { useInstallOffer } from '../../../modules/device-settings/model.ts';
import { useLoaded } from '../../../platform/view/lazy.ts';

const loadSheet = () => import('./InstallSheet/InstallSheet.tsx');

function Loaded({ onClose }: { onClose: () => void }) {
  const sheet = useLoaded(loadSheet);
  return sheet ? <sheet.InstallSheet onClose={onClose} /> : null;
}

export function InstallOffer({ testing }: { testing: boolean }) {
  const offer = useInstallOffer(testing);
  return offer.open ? <Loaded onClose={offer.close} /> : null;
}

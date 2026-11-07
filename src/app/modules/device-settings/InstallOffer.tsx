// El lugar del aviso para instalar, que App pone sobre el marco: la hoja se baja recién cuando toca.
import { useLoaded } from '../../platform/lazy.ts';
import { useInstallOffer } from './install-offer.ts';

const loadSheet = () => import('./screens/InstallSheet/InstallSheet.tsx');

function Loaded({ onClose }: { onClose: () => void }) {
  const sheet = useLoaded(loadSheet);
  return sheet ? <sheet.InstallSheet onClose={onClose} /> : null;
}

export function InstallOffer({ testing }: { testing: boolean }) {
  const offer = useInstallOffer(testing);
  return offer.open ? <Loaded onClose={offer.close} /> : null;
}

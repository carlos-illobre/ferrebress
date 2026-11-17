// El lugar del panel de las listas que se suben: en la composición de la vista, fuera de cualquier
// pantalla (diseño de 08, § 7). Su código se baja recién cuando hay alguna lista.
import { useAnyUpload } from '../../../../modules/price-lists/model.ts';
import { useLazy } from '../../../../platform/view/lazy.ts';

function Loaded() {
  const panel = useLazy(() => import('./Panel.tsx'));
  return panel && panel !== 'offline' ? <panel.UploadsPanel /> : null;
}

export function UploadsSlot() {
  return useAnyUpload() ? <Loaded /> : null;
}

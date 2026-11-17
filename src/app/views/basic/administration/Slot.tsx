// El lugar de Administración en el marco: la pantalla de los ajustes o la que se abrió desde ella
// (Lectores, Archivos de listas), según la dirección. Cada una baja su código recién al abrirla, así
// no pesa en el arranque. Sin red y sin poder bajarla, lo dice (Administración necesita conexión, R1.6).
import { useAdminPage } from '../../../modules/administration/model.ts';
import { useLazy } from '../../../platform/view/lazy.ts';

// Su texto vive acá y no en texts.ts: este archivo va en el arranque y texts.ts no.
const offline = 'Sin conexión: Administración vuelve sola cuando vuelva la conexión.';
const Unloaded = () => (
  <p class="admin-unloaded" role="status">
    {offline}
  </p>
);

function Settings() {
  const screen = useLazy(() => import('./Administration.tsx'));
  if (screen === 'offline') return <Unloaded />;
  return screen ? <screen.Administration /> : null;
}

function ReadersPage() {
  const screen = useLazy(() => import('../price-lists/Readers.tsx'));
  if (screen === 'offline') return <Unloaded />;
  return screen ? <screen.Readers /> : null;
}

export function AdministrationSlot() {
  const page = useAdminPage();
  if (page === 'readers') return <ReadersPage />;
  return <Settings />;
}

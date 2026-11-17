// El lugar de Catálogo en el marco: por ahora, sus listas de precios (08 · pantallas 1, 3 y 4), según la
// dirección. Cada una baja su código recién al abrirla, así no pesa en el arranque. Sin red y sin
// poder bajarla, lo dice.
import { useCatalogPage } from '../../../modules/price-lists/model.ts';
import { useLazy } from '../../../platform/view/lazy.ts';

const offline = 'Sin conexión: Catálogo vuelve solo cuando vuelva la conexión.';
const Unloaded = () => (
  <p class="admin-unloaded" role="status">
    {offline}
  </p>
);

function SuppliersPage() {
  const screen = useLazy(() => import('../price-lists/Suppliers.tsx'));
  if (screen === 'offline') return <Unloaded />;
  return screen ? <screen.Suppliers /> : null;
}

function ReviewPage({ listId }: { listId: string }) {
  const screen = useLazy(() => import('../price-lists/review/Review.tsx'));
  if (screen === 'offline') return <Unloaded />;
  return screen ? <screen.Review listId={listId} /> : null;
}

function SupplierPage({ supplierId }: { supplierId: string }) {
  const screen = useLazy(() => import('../price-lists/supplier/SupplierScreen.tsx'));
  if (screen === 'offline') return <Unloaded />;
  return screen ? <screen.SupplierScreen supplierId={supplierId} /> : null;
}

export function CatalogSlot() {
  const page = useCatalogPage();
  if (page.page === 'supplier')
    return <SupplierPage key={page.supplierId} supplierId={page.supplierId} />;
  if (page.page === 'review') return <ReviewPage key={page.listId} listId={page.listId} />;
  return <SuppliersPage />;
}

// El lugar de Catálogo en el marco: por ahora, sus listas de precios (08 · pantalla 1). Baja su código
// recién al abrirlo, así no pesa en el arranque. Sin red y sin poder bajarlo, lo dice.
import { useLazy } from '../../../platform/view/lazy.ts';

const offline = 'Sin conexión: Catálogo vuelve solo cuando vuelva la conexión.';

export function CatalogSlot() {
  const screen = useLazy(() => import('../price-lists/Suppliers.tsx'));
  if (screen === 'offline')
    return (
      <p class="admin-unloaded" role="status">
        {offline}
      </p>
    );
  return screen ? <screen.Suppliers /> : null;
}

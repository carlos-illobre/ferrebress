// Catálogo → Listas (08 · pantalla 1, R1): cuántos proveedores hay y cuántos tienen algo pendiente
// (que filtran al tocarlos), el buscador, el alta con solo el nombre y los proveedores en orden
// alfabético. Una sola pantalla para los dos anchos. Se baja recién al abrirla (CatalogSlot).
import {
  suppliersTexts as texts,
  useSuppliers,
  type Suppliers as View,
} from '../../../modules/price-lists/model.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { PhoneLight } from '../frame/index.ts';
import { addShapes, Icon } from '../ui/icon/Icon.tsx';
import { rolesShapes } from '../ui/icon/roles-shapes.tsx';
import { LoadState } from '../ui/load-state/LoadState.tsx';
import { Say } from '../ui/say/Say.tsx';
import { AddSupplier } from './AddSupplier.tsx';
import { ScreenSearch } from './ScreenSearch.tsx';
import { Stale } from './Stale.tsx';
import { Supplier } from './Supplier.tsx';
import './Suppliers.css';

addShapes({ plus: rolesShapes.plus });

function Top({ view }: { view: View }) {
  const keys = useShortcutHints('price-lists-suppliers');
  return (
    <div class="suppliers-top">
      <span class="suppliers-total">{view.total}</span>
      {view.filters.map((option) => (
        <button
          key={option.value}
          type="button"
          class="suppliers-filter"
          data-mark=""
          aria-pressed={option.pressed}
          onClick={() => view.toggleFilter(option.value)}
        >
          {option.label}
        </button>
      ))}
      {view.canAdd && !view.adding && (
        <button type="button" class="lists-button" data-mark="" onClick={view.startAdding}>
          <Icon name="plus" size="small" />
          {texts.add}
          {keys.add && <kbd>{keys.add}</kbd>}
        </button>
      )}
    </div>
  );
}

function Body({ view }: { view: View }) {
  if (!view.data)
    return (
      <LoadState look="suppliers-loading" failed={view.failed} texts={texts} retry={view.retry} />
    );
  return (
    <div class={view.live ? '' : 'suppliers-stale'}>
      <Stale screen="price-lists-suppliers" view={view} texts={texts} />
      {view.nothing ? (
        <p class="suppliers-empty">
          <Say words={view.nothing} />
        </p>
      ) : (
        <ul class="suppliers-list">
          {view.suppliers.map((supplier) => (
            <Supplier key={supplier.id} view={view} supplier={supplier} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function Suppliers() {
  const view = useSuppliers();
  return (
    <div class="suppliers">
      <header class="suppliers-head">
        <h1>{texts.title}</h1>
        <PhoneLight />
        {view.data && <Top view={view} />}
        <ScreenSearch look="suppliers-search" words={texts.search} view={view} />
        <AddSupplier view={view} />
      </header>
      <Body view={view} />
    </div>
  );
}

// Catálogo → Listas → un proveedor (08 · pantalla 4, R2.3): su nombre, sus partes (datos, y con «Ver
// costos», cómo cobra, listas y productos), subir una lista suya, dar de baja o reactivar. Una sola
// pantalla para los dos anchos. Se baja recién al abrirla (CatalogSlot).
import {
  type Part,
  type Supplier,
  supplierTexts as texts,
  useSupplier,
} from '../../../../modules/price-lists/model.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import { PhoneLight } from '../../frame/index.ts';
import { Button } from '../../ui/button/Button.tsx';
import { LoadState } from '../../ui/load-state/LoadState.tsx';
import { Say } from '../../ui/say/Say.tsx';
import { Stale } from '../Stale.tsx';
import { UploadButton } from '../uploads/UploadButton.tsx';
import { Data } from './Data.tsx';
import { Items } from './Items.tsx';
import { Lists } from './Lists.tsx';
import { Terms } from './Terms.tsx';
import '../Parts.css';
import './Supplier.css';

const bodies: Record<Part, (props: { view: Supplier }) => preact.JSX.Element | null> = {
  data: Data,
  terms: Terms,
  lists: Lists,
  items: Items,
};

function Tabs({ view }: { view: Supplier }) {
  const keys = useShortcutHints('price-lists-supplier');
  return (
    <div class="supplier-tabs" role="tablist">
      {view.parts.map((part) => (
        <button
          key={part}
          type="button"
          role="tab"
          class="lists-chip"
          data-mark=""
          aria-selected={view.part === part}
          onClick={() => view.choose(part)}
        >
          {texts.parts[part]}
          {keys[part] && <kbd>{keys[part]}</kbd>}
        </button>
      ))}
    </div>
  );
}

function State({ view }: { view: Supplier }) {
  const keys = useShortcutHints('price-lists-supplier');
  return (
    <div class="supplier-state">
      {view.canUpload && (
        <UploadButton onFiles={view.upload} opens={view.picks}>
          {texts.upload}
          {keys.upload && <kbd>{keys.upload}</kbd>}
        </UploadButton>
      )}
      {view.editable && !view.dropping && (
        <Button doing={texts.deactivate} onPress={view.deactivate}>
          {texts.deactivate}
        </Button>
      )}
      {view.canReactivate && (
        <Button doing={texts.reactivate} look="action" onPress={view.reactivate}>
          {texts.reactivate}
        </Button>
      )}
      {view.dropping && (
        <div class="supplier-confirm" role="alertdialog" aria-label={texts.deactivate}>
          <p>
            <Say words={texts.deactivateSays(view.dropping.costs, view.dropping.discontinued)} />
          </p>
          <Button doing={texts.deactivate} look="danger" onPress={view.confirmDeactivate}>
            {texts.confirmDeactivate(view.dropping.costs)}
          </Button>
          <Button doing={texts.cancel} closes onPress={view.cancelDeactivate}>
            {texts.cancel}
          </Button>
        </div>
      )}
      {view.stateSaid && (
        <p class="supplier-said" role="alert">
          {view.stateSaid}
        </p>
      )}
    </div>
  );
}

export function SupplierScreen({ supplierId }: { supplierId: string }) {
  const view = useSupplier(supplierId);
  if (!view.supplier)
    return (
      <div class="supplier-screen">
        <LoadState look="supplier-loading" failed={view.failed} texts={texts} retry={view.retry} />
      </div>
    );
  const Body = bodies[view.part];
  return (
    <div class={view.live ? 'supplier-screen' : 'supplier-screen supplier-stale'}>
      <header class="supplier-head">
        <button type="button" class="supplier-link" data-mark="" onClick={view.back}>
          ‹ {texts.back}
        </button>
        <h1>{view.supplier.name}</h1>
        <PhoneLight />
        {view.supplier.inactive && <b class="supplier-inactive">{texts.inactive}</b>}
      </header>
      <Stale screen="price-lists-supplier" view={view} texts={texts} />
      <State view={view} />
      <Tabs view={view} />
      <Body view={view} />
    </div>
  );
}

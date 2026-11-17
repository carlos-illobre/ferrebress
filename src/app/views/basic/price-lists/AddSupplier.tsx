// Dar de alta un proveedor con solo su nombre (R2.2): el error, en el lugar (E10); si está dado de
// baja, «Reactivar» (E94).
import { type Suppliers, suppliersTexts as texts } from '../../../modules/price-lists/model.ts';
import { Button } from '../ui/button/Button.tsx';

export function AddSupplier({ view }: { view: Suppliers }) {
  const adding = view.adding;
  if (!adding) return null;
  return (
    <form
      class="supplier-add"
      onSubmit={(event) => {
        event.preventDefault();
        void view.create();
      }}
    >
      <label>
        {texts.name}
        <input
          value={adding.name}
          maxLength={80}
          // biome-ignore lint/a11y/noAutofocus: se abre para escribir el nombre
          autoFocus
          onInput={(event) => view.typeName((event.target as HTMLInputElement).value)}
        />
      </label>
      {adding.error && (
        <p class="supplier-add-error" role="alert">
          {adding.error}
        </p>
      )}
      <div class="supplier-add-actions">
        {adding.inactiveId ? (
          <Button
            doing={texts.reactivate}
            look="action"
            onPress={() => view.reactivate(adding.inactiveId as string, adding.name)}
          >
            {texts.reactivate}
          </Button>
        ) : (
          <Button doing={texts.create} look="action" enterDoes onPress={view.create}>
            {texts.create}
          </Button>
        )}
        <Button doing={texts.cancel} closes onPress={view.stopAdding}>
          {texts.cancel}
        </Button>
      </div>
    </form>
  );
}

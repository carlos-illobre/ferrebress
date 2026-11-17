// Los datos de un proveedor (R2.1): cada uno se guarda al salir de su caja, con «Deshacer» (R1.7); lo
// que no vale o lo cambió otra persona se dice en su lugar. Sin «Administrar proveedores», se leen.
import type { Supplier } from '../../../../modules/price-lists/model.ts';
import { privateProps } from '../../../../platform/view/private.ts';

type Line = Supplier['fields'][number];

function Box({ view, line }: { view: Supplier; line: Line }) {
  const common = {
    'aria-label': line.label,
    defaultValue: line.value,
    readOnly: !view.editable,
    onBlur: (event: FocusEvent) =>
      void view.typeField(line.field, (event.target as HTMLInputElement).value),
  };
  return line.multiline ? <textarea rows={2} {...common} /> : <input {...common} data-commit="" />;
}

export function Data({ view }: { view: Supplier }) {
  return (
    <div class="supplier-data">
      {view.fields.map((line) => (
        <div
          key={`${line.field}-${line.value}`}
          class="supplier-field"
          {...(line.personal && privateProps())}
        >
          <span>{line.label}</span>
          <Box view={view} line={line} />
          {view.said[line.field] && (
            <small class="supplier-said" role="alert">
              {view.said[line.field]}
            </small>
          )}
        </div>
      ))}
    </div>
  );
}

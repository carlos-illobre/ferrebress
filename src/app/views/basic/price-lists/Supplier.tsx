// Un proveedor en Catálogo → Listas (08 · pantalla 1, R1.1): su nombre y sus datos de contacto (que
// son personales: se tapan en la captura de «Algo salió mal»), su última lista y lo pendiente; dado de
// baja, «Reactivar».
import type { SupplierLines, Suppliers } from '../../../modules/price-lists/model.ts';
import {
  suppliersTexts as texts,
  uploadsTexts as uploads,
} from '../../../modules/price-lists/model.ts';
import { privateProps } from '../../../platform/view/private.ts';
import { UploadButton } from './uploads/UploadButton.tsx';

function Contact({ supplier }: { supplier: SupplierLines }) {
  return (
    <p class="supplier-contact" {...privateProps()}>
      {supplier.seller && <span>{supplier.seller}</span>}
      {supplier.phone && (
        <>
          <a href={supplier.phone.tel}>{supplier.phone.text}</a>
          <a href={supplier.phone.whatsapp} target="_blank" rel="noopener noreferrer">
            {texts.whatsapp}
          </a>
        </>
      )}
      {supplier.email && <a href={supplier.email.href}>{supplier.email.text}</a>}
      {supplier.note && <span class="supplier-note">{supplier.note}</span>}
    </p>
  );
}

export function Supplier({ view, supplier }: { view: Suppliers; supplier: SupplierLines }) {
  return (
    <li class="supplier">
      <button
        type="button"
        class="supplier-name"
        data-mark=""
        onClick={() => view.open(supplier.id)}
      >
        {supplier.name}
      </button>
      <Contact supplier={supplier} />
      {supplier.last && <p class="supplier-last">{supplier.last}</p>}
      {supplier.pending && (
        <p class={supplier.problem ? 'supplier-pending supplier-problem' : 'supplier-pending'}>
          {supplier.pending}
        </p>
      )}
      {supplier.waitingList && (
        <button
          type="button"
          class="lists-button"
          data-mark=""
          onClick={() => view.review(supplier.waitingList as string)}
        >
          {texts.review}
        </button>
      )}
      {view.canUpload && !view.reactivable && (
        <UploadButton onFiles={(files) => view.upload(files, supplier.id)}>
          {uploads.upload}
        </UploadButton>
      )}
      {view.reactivable && (
        <button
          type="button"
          class="lists-button"
          data-mark=""
          onClick={() => void view.reactivate(supplier.id, supplier.name)}
        >
          {texts.reactivate}
        </button>
      )}
    </li>
  );
}

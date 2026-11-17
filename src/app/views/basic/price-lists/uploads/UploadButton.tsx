// Un botón que abre la elección de archivos y le pasa al modelo los elegidos: solo planillas de Excel
// y CSV (R4.2), varias a la vez (R4.10).
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

type Props = {
  children: ComponentChildren;
  onFiles: (files: File[]) => void;
  look?: string;
  // Cada vez que cambia, se abre la elección (el atajo del modelo).
  opens?: number;
};

export function UploadButton({ children, onFiles, look = 'lists-button', opens = 0 }: Props) {
  const input = useRef<HTMLInputElement>(null); // vista: la caja de archivos, escondida
  useEffect(() => {
    if (opens > 0) input.current?.click();
  }, [opens]);
  return (
    <>
      <button type="button" class={look} data-mark="" onClick={() => input.current?.click()}>
        {children}
      </button>
      <input
        ref={input}
        type="file"
        accept=".xlsx,.xls,.csv"
        multiple
        hidden
        onChange={(event) => {
          const box = event.target as HTMLInputElement;
          onFiles([...(box.files as FileList)]);
          box.value = '';
        }}
      />
    </>
  );
}

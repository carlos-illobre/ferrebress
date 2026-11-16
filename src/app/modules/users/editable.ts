// Cambiar el nombre o el correo en la tarjeta, sin HTML (R3.5, R3.6): el lápiz lo vuelve una caja;
// guardar o cancelar la cierran. Un correo que no se puede usar se dice debajo, sin perder lo escrito
// (R3.3).
import { useState } from 'preact/hooks';
import { refusalTexts } from './texts.ts';

// `save` devuelve el rechazo que va junto al campo, si hay.
export function useEditable(save: (value: string) => Promise<string | undefined>) {
  // local: editar es de quien toca el lápiz.
  const [editing, setEditing] = useState(false);
  // local: lo que contestó el servidor a este dispositivo.
  const [error, setError] = useState<string>();
  const done = () => {
    setError(undefined);
    setEditing(false);
  };
  return {
    editing,
    error,
    start: () => setEditing(true),
    done,
    typing: () => setError(undefined),
    async submit(value: string) {
      const refused = await save(value);
      if (refused) setError(refusalTexts[refused]);
      else done();
    },
  };
}

export type EditableModel = ReturnType<typeof useEditable>;

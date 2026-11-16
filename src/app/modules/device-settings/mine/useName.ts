// El nombre de este dispositivo, sin HTML (04 · R9.2, R9.3): el campo abierto con lo que se escribe,
// la cuenta de letras como la cuenta la limpieza, las ideas, el aviso si otro se llama igual, guardar
// y el brillo al guardar. Lo escrito es de este dispositivo: el otro, en espejo, muestra el suyo
// (R1.6).
import type { MyDevicesResponse } from '@ferrebress/shared/contracts/device-settings';
import { cleanDeviceName, isRepeated } from '@ferrebress/shared/contracts/device-settings';
import { cleanText, lettersIn } from '@ferrebress/shared/text/clean';
import { useState } from 'preact/hooks';
import { useStore } from '../../../platform/store.ts';
import { person } from '../../sign-in/index.ts';
import { deviceSettingsSettings } from '../settings.ts';
import { mineTexts as t } from './texts.ts';
import type { Mine } from './useMine.ts';

type Here = MyDevicesResponse['here'];

export function useName(mine: Mine, here: Here | undefined) {
  // local: el nombre es de este dispositivo; el otro, en espejo, muestra el suyo (R1.6).
  const [draft, setDraft] = useState<string | undefined>();
  // local: el brillo al guardar, en el dispositivo que guardó.
  const [shines, setShines] = useState(false);
  const who = useStore(person);
  const names = mine.state.status === 'ready' ? mine.state.data.names : [];
  // Lo que se va a guardar, limpio; undefined si así no se puede guardar.
  const clean = draft === undefined ? undefined : cleanDeviceName(draft);
  const save = async (name: string) => {
    const saved = await mine.rename(name);
    if (!saved) return;
    setDraft(undefined);
    setShines(true);
    setTimeout(() => setShines(false), deviceSettingsSettings.shineMs);
  };
  return {
    current: here?.deviceName,
    // Lo que muestra el dibujo: lo que se escribe, letra por letra, o el nombre guardado.
    shown: draft === undefined ? here?.deviceName : draft.trim(),
    draft,
    // Contadas como las cuenta la limpieza: lo que se va a guardar.
    letters: lettersIn(cleanText(draft ?? '', Number.POSITIVE_INFINITY) ?? ''),
    canSave: clean !== undefined,
    repeated: !!clean && isRepeated(clean, names),
    ideas: t.name.ideas(here?.isPhone ?? false, who?.name.split(' ')[0] ?? ''),
    shines,
    edit: () => setDraft(here?.deviceName ?? ''),
    type: (text: string) => setDraft(text),
    cancel: () => setDraft(undefined),
    submit: () => {
      if (clean !== undefined) void save(clean ?? '');
    },
    clear: () => void save(''),
  };
}

export type NameModel = ReturnType<typeof useName>;

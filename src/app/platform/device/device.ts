// El dispositivo (diseño de 01, § 10): su identificador, que se guarda la primera vez, el de la
// pestaña, que sobrevive a recargarla, y si es un celular.
import { readStored, store } from './storage.ts';

const deviceIdKey = 'ferrebress.device-id';

export function deviceId(): string {
  const stored = readStored<string>(deviceIdKey);
  if (stored) return stored;
  const id = crypto.randomUUID();
  store(deviceIdKey, id);
  return id;
}

// La pestaña: sessionStorage es de cada pestaña y sobrevive a recargarla. Se conserva solo si la
// página se recargó: una pestaña duplicada copia lo guardado de la original, y no tiene que pasar
// por ella. Sin sessionStorage, ninguna. Se decide una vez por página.
const tabIdKey = 'ferrebress.tab-id';
let tab: { id: string | undefined } | undefined;

function loadTabId(): string | undefined {
  try {
    const [navigation] = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    const stored = sessionStorage.getItem(tabIdKey);
    if (stored && navigation?.type === 'reload') return stored;
    const id = crypto.randomUUID();
    sessionStorage.setItem(tabIdKey, id);
    return id;
  } catch {
    return undefined;
  }
}

export function tabId(): string | undefined {
  tab ??= { id: loadTabId() };
  return tab.id;
}

type UserAgentData = { mobile?: boolean };

export function isPhone(): boolean {
  const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  return data?.mobile ?? /Android|iPhone/.test(navigator.userAgent);
}

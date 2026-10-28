// Lo poco que la aplicación guarda en el dispositivo sin trabajar sin conexión (diseño de 01, § 2):
// nada del negocio ni secreto. Si el navegador no deja guardar (ventana privada), sigue sin eso.
export function readStored<T>(key: string): T | undefined {
  try {
    const value = localStorage.getItem(key);
    return value === null ? undefined : (JSON.parse(value) as T);
  } catch {
    return undefined;
  }
}

export function store(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin lugar o sin permiso: se sigue sin guardarlo.
  }
}

export function forget(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Igual que al guardar.
  }
}

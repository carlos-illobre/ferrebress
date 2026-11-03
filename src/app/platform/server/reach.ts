// Cuándo tiene sentido volver a probar el servidor: con la pantalla a la vista y con red. Lo usan la
// reconexión y el canal temporal, que esperan a que vuelva alguna de las dos.
export const canReach = () => document.visibilityState === 'visible' && navigator.onLine;

// Avisa cada vez que cambia la red o la vista; devuelve cómo dejar de avisar.
export function watchReach(listener: () => void): () => void {
  document.addEventListener('visibilitychange', listener);
  addEventListener('online', listener);
  addEventListener('offline', listener);
  return () => {
    document.removeEventListener('visibilitychange', listener);
    removeEventListener('online', listener);
    removeEventListener('offline', listener);
  };
}

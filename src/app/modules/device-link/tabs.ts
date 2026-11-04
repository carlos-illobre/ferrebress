// Qué pestaña espeja (R6.4; diseño de 03, § 6): la última que se usó. Con el candado del navegador
// (Web Locks): la pestaña donde la persona toca o aprieta una tecla, a la vista, lo toma «robándolo»;
// la que lo tenía se entera porque el navegador le corta el suyo. Al abrir, lo toma solo si nadie lo
// tiene. Un navegador sin candados tiene una sola pestaña que cuenta: esta.
export const lockName = 'ferrebress.mirror';

type Locks = Pick<LockManager, 'request'>;
type Options = { locks?: Locks | undefined; onChange(mine: boolean): void };

export function createTabs({ locks = navigator.locks, onChange }: Options) {
  let mine = false;
  let release: (() => void) | undefined;

  const set = (value: boolean) => {
    if (mine === value) return;
    mine = value;
    onChange(value);
  };

  // Mientras la promesa del candado no termina, es de esta pestaña.
  const hold = (options: LockOptions) =>
    (locks as Locks)
      .request(lockName, options, (lock) => {
        if (!lock) return undefined;
        set(true);
        return new Promise<void>((done) => (release = done));
      })
      .catch(() => undefined)
      .finally(() => {
        release = undefined;
        set(false);
      });

  const take = () => {
    if (!mine && document.visibilityState === 'visible') void hold({ steal: true });
  };

  // Sin candados no hay a quién avisar todavía: quien la crea lo lee con `mine()`.
  if (!locks) mine = true;
  else {
    void hold({ ifAvailable: true });
    addEventListener('pointerdown', take, true);
    addEventListener('keydown', take, true);
  }

  return {
    mine: () => mine,
    stop() {
      removeEventListener('pointerdown', take, true);
      removeEventListener('keydown', take, true);
      release?.();
    },
  };
}

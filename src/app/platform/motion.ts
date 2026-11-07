// Si la aplicación se mueve: lo apaga la persona (motionOff, que pone quien guarda su elección) o lo
// pide el sistema («reducir movimiento»). Cualquiera de los dos pone data-motion="off" en <html>, y
// una sola regla de styles/base.css apaga las animaciones de todas las pantallas; lo que lleva
// .keeps-moving (la marca de espera, la barra de avance) sigue. El código que anima por su cuenta
// pregunta a still().
import { useEffect, useState } from 'preact/hooks';
import { createStore } from './store.ts';

const reduceQuery = '(prefers-reduced-motion: reduce)';

// Lo que eligió la persona: true, sin movimiento.
export const motionOff = createStore(false);

// Lo que pide el sistema, leído en el momento.
export const systemStill = () => matchMedia(reduceQuery).matches;

export const still = () => systemStill() || motionOff.get();

function apply(): void {
  const root = document.documentElement;
  if (still()) root.dataset.motion = 'off';
  else delete root.dataset.motion;
}

// Escucha si el sistema cambia lo que pide, con la aplicación abierta.
function onSystemChange(listener: () => void): () => void {
  const media = matchMedia(reduceQuery);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

// Se llama una vez al arrancar, antes de dibujar: sigue a la persona y al sistema.
export function watchMotion(): () => void {
  apply();
  const stopSystem = onSystemChange(apply);
  const stopPerson = motionOff.subscribe(apply);
  return () => {
    stopSystem();
    stopPerson();
  };
}

// Para una pantalla que muestra lo que pide el sistema: se vuelve a dibujar si cambia.
export function useSystemStill(): boolean {
  const [value, setValue] = useState(systemStill);
  useEffect(() => onSystemChange(() => setValue(systemStill())), []);
  return value;
}

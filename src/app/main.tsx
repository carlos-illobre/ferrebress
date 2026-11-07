// Monta la aplicación en la página, prende el teclado de la computadora y registra el service worker
// (platform/offline), que permite instalarla y abrirla sin conexión. En desarrollo no hay sw.js.
import { render } from 'preact';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App.tsx';
import { watchInstall } from './platform/install.ts';
import { startKeyboard } from './platform/keyboard.ts';
import { watchMotion } from './platform/motion.ts';

// Antes de dibujar: el movimiento, para que nada arranque y se corte, y el aviso del navegador de que
// se puede instalar, que llega una sola vez y temprano (diseño de 04, § 4).
watchMotion();
watchInstall();
startKeyboard();
render(<App />, document.getElementById('app') as HTMLElement);
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  // Si no se puede registrar (un navegador que lo impide), la aplicación anda igual, sin instalarse.
  navigator.serviceWorker.register('/sw.js').catch(() => undefined);

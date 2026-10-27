// Monta la aplicación en la página y prende el teclado de la computadora.
import { render } from 'preact';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App.tsx';
import { startKeyboard } from './platform/keyboard.ts';

startKeyboard();
render(<App />, document.getElementById('app') as HTMLElement);

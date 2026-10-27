// Antes de cada prueba de la aplicación: lo que dejó dibujado la anterior se borra, para que cada
// una empiece con la pantalla vacía.
import { cleanup } from '@testing-library/preact';
import { afterEach } from 'vitest';

afterEach(cleanup);

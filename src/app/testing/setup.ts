// Antes de cada prueba de la aplicación: lo que dejó dibujado la anterior se borra, para que cada
// una empiece con la pantalla vacía. La zona del negocio es la de la ferretería, como la que trae
// /api/start en las pruebas.

import { setBusinessTimeZone } from '@ferrebress/shared/time/business';
import { cleanup } from '@testing-library/preact';
import { afterEach } from 'vitest';

afterEach(cleanup);

setBusinessTimeZone('America/Argentina/Buenos_Aires');

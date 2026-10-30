// El nombre del producto, en un solo lugar: con él se nombran la cabecera de cada respuesta, lo que
// la aplicación guarda en el dispositivo y la huella. Si la base se usara en otro proyecto, se
// cambia solo esto. Cambiar `id` en Ferrebress cambiaría lo ya guardado en cada dispositivo (su
// identificador, con el que está vinculada la huella): no se toca.
export const product = { id: 'ferrebress', name: 'Ferrebress' } as const;

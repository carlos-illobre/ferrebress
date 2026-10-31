// Una figura de un ícono del manual: la etiqueta SVG y sus atributos.
export type Shape = [
  tag: 'path' | 'circle' | 'line' | 'polyline' | 'polygon' | 'rect',
  attributes: Record<string, string>,
];

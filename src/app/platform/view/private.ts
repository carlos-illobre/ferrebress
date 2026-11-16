// Lo privado (00 · R9.4): todo lo que muestra un nombre, un correo o un dato personal se marca con
// esto, para que la captura de «Algo salió mal» lo tape. La vista no sabe cómo se marca. Parte del
// contrato de las vistas (ADR-019).
export const privateProps = (): { 'data-private': '' } => ({ 'data-private': '' });

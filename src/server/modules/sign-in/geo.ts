// Lo único que entrar sabe de la ciudad de una dirección de internet (diseño de 01, § 8): una
// función. Hoy la cumple el adaptador de la base local; cambiarla por un servicio externo es
// escribir otro adaptador, sin tocar este módulo.
export type FindCity = (ipAddress: string) => Promise<string | undefined>;

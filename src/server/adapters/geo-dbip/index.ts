// La ciudad aproximada de una dirección de internet con la base local DB-IP Lite (diseño de 01,
// § 8): la consulta no sale de la máquina. Cumple la función FindCity de entrar; para usar un
// servicio externo se escribe otro adaptador y se cambia una línea de main.ts.
import { readFile } from 'node:fs/promises';
import { type CityResponse, Reader } from 'mmdb-lib';
import type { FindCity } from '../../modules/sign-in/geo.ts';

// Sin la base (todavía no se bajó), todas las ciudades son desconocidas y la entrada sigue.
export async function openDbIpCities(path: string): Promise<FindCity> {
  const file = await readFile(path).catch(() => undefined);
  if (!file) {
    console.warn(`No está la base de ciudades en ${path}: las ciudades van a ser desconocidas.`);
    return async () => undefined;
  }
  const reader = new Reader<CityResponse>(file);
  // Una dirección mal escrita no tiene ciudad; si la biblioteca falla, entrar lo toma como
  // desconocida.
  return async (ipAddress) => {
    const names = reader.get(ipAddress)?.city?.names;
    return names?.es ?? names?.en;
  };
}

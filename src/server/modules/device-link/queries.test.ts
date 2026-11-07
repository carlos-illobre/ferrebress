// Cuántas consultas hace cada pedido del vínculo (diseño de 03, § 18.4; constitución XII.2): una
// cantidad fija, sin consultas dentro de un bucle.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listen, signedIn, time } from '../../testing/device-link.ts';
import { createSignInServer, type SignInServer } from '../../testing/sign-in/sign-in-server.ts';

let server: SignInServer;
let now = new Date('2026-11-07T10:00:00Z').getTime();

beforeAll(async () => {
  server = await createSignInServer({ now: () => new Date(now) }, { wait: time.wait });
});
afterAll(() => server.close());

async function showCode(computer: Awaited<ReturnType<typeof signedIn>>) {
  const tab = await listen(server, computer, 'device-link.code');
  return { tab, code: () => tab.last('device-link.code')?.code as string };
}

describe('las consultas del vínculo', () => {
  it('vincular, preguntar, reemplazar, espejar y vencer: una cantidad fija', async () => {
    const counts: Record<string, number> = {};
    const [computer, phone] = [await signedIn(server, false), await signedIn(server, true)];
    await phone.request('/api/start');
    const first = await showCode(computer);
    counts.read = await server.countQueries(() =>
      phone.request('/api/device-link/codes/read', { code: first.code() }),
    );
    await first.tab.close();
    const other = await signedIn(server, false);
    const second = await showCode(other);
    let ticket = '';
    counts.ask = await server.countQueries(async () => {
      ticket = (await phone.request('/api/device-link/codes/read', { code: second.code() })).body
        .ticket;
    });
    counts.accept = await server.countQueries(() =>
      phone.request('/api/device-link/codes/accept', { ticket }),
    );
    await second.tab.close();
    counts.check = await server.countQueries(() => phone.request('/api/device-link/check'));
    now += 31 * 24 * 60 * 60_000;
    counts.jobs = await server.countQueries(() => server.runJobs());
    // Aceptar: abrir y cerrar la transacción, leer los vínculos de los dos dispositivos, borrar el
    // reemplazado y crear el nuevo. Preguntar no escribe. Confirmar no consulta la base: el vínculo
    // está en memoria. Los trabajos: vencer en una consulta, y los de la entrada (con los dos de los
    // dispositivos: anotar los usados hoy y borrar los que nadie usa).
    expect(counts).toEqual({ read: 5, ask: 3, accept: 5, check: 0, jobs: 7 });
  });
});

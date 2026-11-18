// El rendimiento del catálogo con 100.000 productos (07 · R3.3, E15; diseño de 07, § 10): armar el
// índice, buscar, la memoria del índice, buscar por la ruta, contar para el redondeo y recalcular. La
// base de pruebas (PGlite) es más lenta que PostgreSQL: lo que pasa acá pasa con más margen en el
// servidor. Imprime cada medida para anotarla.
import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import { createSearchIndex } from '@ferrebress/shared/search/index';
import { type Kysely, sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogKit, createCatalogKit } from '../../testing/catalog/catalog-kit.ts';
import { createTimer } from '../../testing/perf.ts';
import { pagesData } from './data/pages.ts';
import { pricingData } from './data/pricing.ts';
import type { CatalogTables } from './data/products.ts';

// Lo que se espera y el tope (07 · R3.3, R3.5).
const products = Number(process.env.CATALOG_PERF_PRODUCTS ?? 100_000);
// La memoria que queda después de juntar la basura: lo que el índice retiene de verdad.
setFlagsFromString('--expose_gc');
const collect = runInNewContext('gc') as () => void;
const retained = () => {
  collect();
  return process.memoryUsage().heapUsed;
};
const { measured, timed } = createTimer();

describe('el rendimiento del catálogo, con 100.000 productos', () => {
  let kit: CatalogKit;
  let db: Kysely<CatalogTables>;
  beforeAll(async () => {
    kit = await createCatalogKit();
    db = kit.server.platform.db as unknown as Kysely<CatalogTables>;
    // Descripciones inventadas como las de una lista de verdad: de 8 a 12 palabras, con tipo, uso,
    // material, terminación, medidas, un modelo y una marca; con margen la mitad.
    await sql`
      insert into catalog.products (id, supplier_code, barcode, description, brand, vat,
        vat_from_list, cost, margin, search_key)
      select gen_random_uuid(), 'C' || n, '779' || lpad(n::text, 10, '0'),
        (array['Tornillo','Tuerca','Arandela','Clavo','Mecha','Tarugo','Bisagra','Cerradura',
          'Llave','Pinza','Destornillador','Martillo','Sierra','Lija','Cinta','Manguera'])[1 + n % 16]
          || ' ' || (array['autoperforante','hexagonal','plana','punta','madera','metal','mampostería',
          'chapa','cruz','paleta','combinada','ajustable'])[1 + (n / 16) % 12]
          || ' ' || (array['acero','bronce','galvanizado','inoxidable','zincado','niquelado',
          'cromado','plástico','aluminio'])[1 + (n / 7) % 9]
          || ' ' || (array['blanco','negro','gris','natural','pavonado'])[1 + (n / 3) % 5]
          || ' ' || (3 + n % 47) || 'mm x ' || (10 + n % 113) || 'mm'
          || ' modelo ' || chr(65 + n % 26) || chr(65 + (n / 26) % 26) || '-' || (n % 9973)
          || case when n % 3 = 0 then ' caja x ' || (10 + n % 90) || ' unidades' else '' end
          || case when n % 5 = 0 then ' uso profesional' else '' end,
        (array['Fischer','Bremen','Tramontina','Stanley','Black Decker','Bosch','Makita',
          'Truper','Gamma','Dowen Pagio',null])[1 + n % 11], 210, 210,
        1000000::bigint * (1 + n % 5000), case when n % 2 = 0 then 50 end, ''
      from generate_series(1, ${products}) as n`.execute(db);
    await sql`update catalog.products set raw_cents = cost * (100 + margin) * 1210 / 1000000000,
      sale_cents = (cost * (100 + margin) * 1210 / 1000000000 + 99999) / 100000 * 100000
      where margin is not null`.execute(db);
  });
  afterAll(async () => {
    console.table(measured);
    await kit.server.close();
  });

  it('armar el índice: una consulta y menos de 2 s; unos 45 MB', async () => {
    const before = retained();
    const { value: docs } = await timed('leer los productos', () => pagesData(db).docs());
    const { value: index, ms } = await timed('armar el índice', () => createSearchIndex(docs));
    docs.length = 0;
    const mb = (retained() - before) / 2 ** 20;
    measured['memoria del índice'] = `${Math.round(mb)} MB`;
    expect(index.size()).toBe(products);
    expect(ms).toBeLessThan(2000 * (products / 100_000));
    expect(mb).toBeLessThan(150 * (products / 100_000));
  });

  it('catalog-E15: buscar una palabra, empezada o con un error, en menos de 100 ms', async () => {
    const index = createSearchIndex(await pagesData(db).docs());
    for (const text of ['tornillo', 'torn hexag', 'tornilo', 'arandela plana 5', 'C77', ''])
      expect((await timed(`buscar «${text}»`, () => index.search({ text }))).ms).toBeLessThan(100);
    expect(index.search({ text: 'tornilo' }).ids.length).toBeGreaterThan(0);
  });

  it('poner al día el índice no frena: un producto, al instante; una lista grande, de a pedazos', async () => {
    let last = performance.now();
    let longest = 0;
    const pause = async () => {
      longest = Math.max(longest, performance.now() - last);
      await new Promise<void>((done) => setTimeout(done, 0));
      last = performance.now();
    };
    const docs = await pagesData(db).docs();
    const index = createSearchIndex(docs, { pause });
    const one = { ...(docs[0] as (typeof docs)[number]), description: 'Tornillo cambiado' };
    const { ms: single } = await timed('poner al día un producto', () => index.replace([one], []));
    expect(single).toBeLessThan(50);
    const many = docs.slice(0, 10_000).map((doc) => ({ ...doc, priced: !doc.priced }));
    last = performance.now();
    const { ms: started } = await timed('recibir una lista de 10.000', () =>
      index.replace(many, []),
    );
    await index.settled();
    measured['lo más largo sin ceder el turno'] = `${Math.round(longest)} ms`;
    expect(started).toBeLessThan(50);
    expect(longest).toBeLessThan(500);
  });

  it('contar para el redondeo y recalcular, en menos de 5 s', async () => {
    const { ms: counting } = await timed('contar cuántos cambian', () =>
      pricingData(db).changesWith(5000),
    );
    const { value: changed, ms } = await timed('recalcular todos', () =>
      db.transaction().execute((trx) => pricingData(trx).applyStep(5000)),
    );
    expect(changed).toBeGreaterThan(0);
    expect(counting).toBeLessThan(5000);
    expect(ms).toBeLessThan(5000);
  });
});

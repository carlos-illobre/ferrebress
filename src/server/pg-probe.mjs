import { PGlite } from '@electric-sql/pglite';

let t = Date.now();
const a = new PGlite();
await a.query('select 1');
console.log('primera', Date.now() - t);
t = Date.now();
const b = new PGlite();
await b.query('select 1');
console.log('segunda', Date.now() - t);
t = Date.now();
const c = await a.clone();
await c.query('select 1');
console.log('clone', Date.now() - t);
t = Date.now();
const dump = await a.dumpDataDir('none');
const d = new PGlite({ loadDataDir: dump });
await d.query('select 1');
console.log('desde dump', Date.now() - t);

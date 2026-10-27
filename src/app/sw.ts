// El service worker: conecta los eventos del navegador con platform/offline/worker.ts, que tiene
// las pruebas. Se arma aparte, como /sw.js, sin nombre con hash, para que su dirección no cambie.
import { asset, boxName, install, kindOf, page } from './platform/offline/worker.ts';

type FetchEvent = Event & { request: Request; respondWith(response: Promise<Response>): void };
type LifeEvent = Event & { waitUntil(work: Promise<unknown>): void };
type Worker = {
  location: Location;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  addEventListener(type: 'install' | 'activate', listener: (event: LifeEvent) => void): void;
  addEventListener(type: 'fetch', listener: (event: FetchEvent) => void): void;
};

const worker = self as unknown as Worker;
const box = () => caches.open(boxName);
const fetcher = (request: Request | string) => fetch(request);

worker.addEventListener('install', (event) => {
  event.waitUntil(
    box()
      .then((opened) => install(opened, fetcher))
      .then(() => worker.skipWaiting()),
  );
});

worker.addEventListener('activate', (event) => event.waitUntil(worker.clients.claim()));

worker.addEventListener('fetch', (event) => {
  const kind = kindOf(event.request, worker.location.origin);
  if (kind === 'skip') return;
  const handle = kind === 'page' ? page : asset;
  event.respondWith(box().then((opened) => handle(event.request, opened, fetcher)));
});

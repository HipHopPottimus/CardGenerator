const VERSION = "1.0.0";

const CHANGE_NOTES = "This is the first release of CardGenerator.";

const CACHE_NAME = "CardGeneratorCacheV:"+VERSION;

//TODO- OUTDATED RESOURCES
const APP_RESOURCES = [
    "./fileInterface.js",
    "./IDBWebStorage.js",
    "./index.html",
    "./index.js",
    "./index.css",
    "./cardTypes.html",
    "./cardTypes.js",
    "./install.html",
    "./install.js",
    "./openFile.html",
    "./openFile.js"
];

self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        let cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName != CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        );
        await clients.claim();
      })(),
    );
});


self.addEventListener("install", (event) => {
    event.waitUntil(
      (async () => {
        await self.skipWaiting();
        (new BroadcastChannel("SWComms")).postMessage({type: "update",version: VERSION,notes: CHANGE_NOTES});
        let cache = await caches.open(CACHE_NAME);
        cache.addAll(APP_RESOURCES);
      })(),
    );
  });


self.addEventListener("fetch", (e) => {
    e.respondWith(
        (async () => {
            let resource = await caches.match(e.request);
            if (resource) {
                return resource;
            }
            else{
                try{
                    return await fetch(e.request);
                }
                catch{
                    return new Response("There was an error fetching "+e.request.url);
                }
            }
        })(),
    );
});
const VERSION = "1.0.4.19";

const CHANGE_NOTES = "Fixed a problem with redirects and app starting url while working offline and changed the app to a light theme";

const CACHE_NAME = "CardGeneratorCacheV:"+VERSION;

const APP_RESOURCES = [
  //card editor
  "./card-editor/index.html",
  "./card-editor/cardEditor.js",
  //card type editor
  "./type-manager/index.html",
  "./type-manager/cardTypes.js",
  //splash page
  "./file/index.html",
  //install page
  "./install/index.html",
  //asorted scripts and style
  "./fileInterface.js",
  "./IDBWebStorage.js",
  "./style.css"
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
                catch(error){
                    return new Response("There was an error fetching "+e.request.url+"<br>"+error);
                }
            }
        })(),
    );
});
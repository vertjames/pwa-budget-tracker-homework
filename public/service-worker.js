self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("static-cache-v2").then(cache => {
      console.log("Your files were pre-cached successfully!")
      return cache.addAll([
        "/",
        "/index.html",
        "/index.js",
        "/db.js",
        "/manifest.webmanifest",
        "/styles.css",
        "/icons/icon-192x192.png",
        "/icons/icon-512x512.png"
      ])
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== "static-cache-v2" && key !== "data-cache-v1") {
            console.log("Removing old cache data", key)
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener("fetch", event => {
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open("data-cache-v1").then(cache => {
        return fetch(event.request)
          .then(response => {
            if (response.status === 200) {
              cache.put(event.request.url, response.clone())
            }
            return response
          })
          .catch(err => {
            return cache.match(event.request)
          })
      }).catch(err => console.log(err))
    )
    return
  }
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
    })
  )
})

// /public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Bucks Flow'
  const options = {
    body: data.body || 'Nova atualização do seu parceiro(a)',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard'
    }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})

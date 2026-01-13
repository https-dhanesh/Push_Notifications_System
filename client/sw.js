self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    let title = 'Default Title';
    let options = {
        body: 'Default Body',
        icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827349.png'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            title = data.title || "Default Title" ;
            options.body = data.body;
        } catch (e) {
            console.error('Error parsing push data:', e);
            options.body = event.data.text();
        }
    }
    const notificationPromise = self.registration.showNotification(title, options);
    event.waitUntil(notificationPromise);
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click received.');
    event.notification.close();
    event.waitUntil(clients.openWindow('http://localhost:8080'));
});
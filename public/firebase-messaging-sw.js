// Firebase Cloud Messaging Service Worker
// Arquivo: public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase será inicializado via postMessage do App
// Este service worker aguarda a configuração antes de usar o Firebase
let messaging = null;

// Recebe a configuração do Firebase do aplicativo
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_FIREBASE') {
    const firebaseConfig = event.data.config;
    try {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();
      console.log('Firebase inicializado no Service Worker');
    } catch (error) {
      console.error('Erro ao inicializar Firebase:', error);
    }
  }
});

// Handle background messages
self.addEventListener('push', (event) => {
  if (!messaging) {
    console.warn('Firebase não inicializado. Mensagem ignorada.');
    return;
  }

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('Background message received:', payload);

      const notificationTitle = payload.notification?.title || 'driveFinance';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: payload.data?.tag || 'notification',
        data: payload.data || {},
        requireInteraction: payload.data?.requireInteraction === 'true',
      };

      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    } catch (error) {
      console.error('Erro ao processar mensagem push:', error);
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Procura por uma janela já aberta
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não encontrar, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});

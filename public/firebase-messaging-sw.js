// Firebase Cloud Messaging Service Worker
// Arquivo: public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "{{ VITE_FIREBASE_API_KEY }}",
  authDomain: "{{ VITE_FIREBASE_AUTH_DOMAIN }}",
  projectId: "{{ VITE_FIREBASE_PROJECT_ID }}",
  storageBucket: "{{ VITE_FIREBASE_STORAGE_BUCKET }}",
  messagingSenderId: "{{ VITE_FIREBASE_MESSAGING_SENDER_ID }}",
  appId: "{{ VITE_FIREBASE_APP_ID }}",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
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

  return self.registration.showNotification(notificationTitle, notificationOptions);
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

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

let messaging: ReturnType<typeof getMessaging> | null = null;

/**
 * Inicializa Firebase Cloud Messaging (FCM)
 * Deve ser chamado na primeira renderização do app
 */
export async function initializeMessaging(): Promise<ReturnType<typeof getMessaging> | null> {
  if (messaging) return messaging;

  try {
    // Verifica se o navegador suporta service workers
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    messaging = getMessaging(app);

    // Registra o service worker para FCM
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    // Envia a configuração do Firebase para o Service Worker
    if (registration.active || registration.installing || registration.waiting) {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
      
      const controller = navigator.serviceWorker.controller || registration.installing;
      if (controller) {
        controller.postMessage({
          type: 'INIT_FIREBASE',
          config: firebaseConfig,
        });
      }
    }

    return messaging;
  } catch (error) {
    return null;
  }
}

/**
 * Solicita permissão de notificação e registra o token do dispositivo
 * Retorna o token se bem-sucedido, null caso contrário
 */
export async function requestNotificationPermission(): Promise<string | null> {
  const msg = await initializeMessaging();
  if (!msg) return null;

  try {
    // Verifica permissão atual
    const permission = Notification.permission;
    if (permission === 'denied') {
      return null;
    }

    if (permission === 'granted') {
      // Já tem permissão, gera token
      return await getToken(msg, {
        vapidKey: import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY,
      });
    }

    // Solicita permissão
    const permissionResult = await Notification.requestPermission();
    if (permissionResult === 'granted') {
      const token = await getToken(msg, {
        vapidKey: import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY,
      });
      return token;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Setup listener para mensagens em foreground
 * (quando o app está aberto)
 */
export function setupForegroundMessageListener(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void,
) {
  const msg = messaging;
  if (!msg) {
    return () => {};
  }

  return onMessage(msg, (payload) => {
    const title = payload.notification?.title || '';
    const body = payload.notification?.body || '';
    const data = payload.data || {};

    callback({ title, body, data });
  });
}

/**
 * Armazena o token FCM no Firestore do usuário
 * Para que o servidor possa enviar notificações direcionadas
 */
export async function saveFcmTokenToFirestore(
  fcmToken: string,
  userId: string,
  db: any, // firestore instance
) {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(
      doc(db, `users/${userId}`),
      {
        fcmToken,
        fcmTokenUpdatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (error) {
    // Silently fail - not critical if token save fails
  }
}

/**
 * Hook para configurar notificações
 * Uso: useEffect(() => { setupPushNotifications(userId, db) }, [])
 */
export async function setupPushNotifications(userId: string, db: any) {
  try {
    const token = await requestNotificationPermission();
    if (token) {
      await saveFcmTokenToFirestore(token, userId, db);
    }
  } catch (error) {
    // Silently fail - not critical if push notification setup fails
  }
}

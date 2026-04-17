import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './firebase';

let messaging: Messaging | null = null;

/**
 * Inicializa Firebase Cloud Messaging (FCM)
 * Deve ser chamado na primeira renderização do app
 */
export async function initializeMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;

  try {
    // Verifica se o navegador suporta service workers
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers não suportados no navegador');
      return null;
    }

    messaging = getMessaging(app);

    // Registra o service worker para FCM
    if (!navigator.serviceWorker.controller) {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
    }

    return messaging;
  } catch (error) {
    console.error('Erro ao inicializar FCM:', error);
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
      console.warn('Notificações foram bloqueadas pelo usuário');
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
    console.error('Erro ao solicitar permissão de notificação:', error);
    return null;
  }
}

/**
 * Setup listener para mensagens em foreground
 * (quando o app está aberto)
 */
export function setupForegroundMessageListener(
  onMessage: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void,
) {
  const msg = messaging;
  if (!msg) {
    console.warn('FCM não inicializado. Chame initializeMessaging() primeiro.');
    return () => {};
  }

  return onMessage(msg, (payload) => {
    const title = payload.notification?.title || '';
    const body = payload.notification?.body || '';
    const data = payload.data || {};

    console.log('Notificação em foreground:', { title, body, data });
    onMessage({ title, body, data });
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
    console.log('Token FCM salvo no Firestore');
  } catch (error) {
    console.error('Erro ao salvar token FCM:', error);
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
      console.log('Notificações configuradas com sucesso');
    } else {
      console.warn('Usuário recusou permissões ou navegador não suporta notificações');
    }
  } catch (error) {
    console.error('Erro ao configurar notificações:', error);
  }
}

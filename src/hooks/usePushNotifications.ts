import { useEffect, useCallback, useState } from 'react';
import { db } from '../lib/firebase';
import { setupPushNotifications, setupForegroundMessageListener } from '../lib/messaging';

export function usePushNotifications(userId: string | undefined) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Setup inicial das notificações
  useEffect(() => {
    if (!userId) return;

    const setup = async () => {
      try {
        // Verifica permissão atual
        const permission = Notification.permission;
        setHasPermission(permission === 'granted');

        // Configura notificações
        await setupPushNotifications(userId, db);

        // Setup listener para mensagens em foreground
        const unsubscribe = setupForegroundMessageListener((payload) => {
          // Aqui você pode processar notificações quando o app está aberto

          // Opcionalmente, mostra uma toast ou notificação customizada
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.title || 'Notificação', {
              body: payload.body,
              icon: '/favicon.svg',
            });
          }
        });

        return () => unsubscribe?.();
      } catch (error) {
        console.error('Erro ao configurar notificações:', error);
      }
    };

    setup();
  }, [userId]);

  // Função para solicitar permissão manualmente
  const requestPermission = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
      return permission === 'granted';
    } catch (error) {
      return false;
    }
  }, []);

  return {
    hasPermission,
    requestPermission,
  };
}

/**
 * Hook para monitorar metas mensais e disparar notificações
 * Chama callback quando o usuário atinge a meta mensal
 */
export function useMonthlyGoalNotification(
  earningsThisMonth: number,
  monthlyGoal: number,
  onGoalReached?: () => void,
) {
  const [goalReachedAlerted, setGoalReachedAlerted] = useState(false);

  useEffect(() => {
    // Se atingiu a meta e ainda não fo notificado
    if (earningsThisMonth >= monthlyGoal && monthlyGoal > 0 && !goalReachedAlerted) {
      setGoalReachedAlerted(true);

      // Mostra notificação
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Meta Mensal Atingida! 🎉', {
          body: `Parabéns! Você atingiu sua meta mensal de ${earningsThisMonth.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'monthly-goal',
        });
      }

      onGoalReached?.();
    }
  }, [earningsThisMonth, monthlyGoal, goalReachedAlerted, onGoalReached]);

  return { goalReachedAlerted };
}

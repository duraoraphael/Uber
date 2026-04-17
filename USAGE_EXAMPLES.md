# Exemplos de Uso - Novos Recursos

Este documento contém exemplos práticos de como usar os 3 recursos implementados.

---

## 📊 CSV Export - Exemplos

### Exemplo 1: Exportar ganhos do mês atual

```typescript
import { Button } from '@/components/ui/Button';
import { exportEarningsCSV } from '@/lib/csvExport';
import { useToast } from '@/components/ui/Toast';

export function ExportButton({ earnings, currentMonth }) {
  const { toast } = useToast();

  const handleExport = () => {
    const success = exportEarningsCSV(earnings, currentMonth);
    if (success) {
      toast('Ganhos exportados com sucesso!', 'success');
    } else {
      toast('Nenhum dado para exportar', 'error');
    }
  };

  return (
    <Button onClick={handleExport}>
      <Download className="h-4 w-4" /> Baixar Ganhos (CSV)
    </Button>
  );
}
```

### Exemplo 2: Exportar consolidado (earnings + expenses)

```typescript
import { exportConsolidatedCSV } from '@/lib/csvExport';

function JanuaryReport({ earnings, expenses }) {
  const handleDownloadReport = () => {
    const success = exportConsolidatedCSV(
      earnings,
      expenses,
      '2024-01' // Ganhos e gastos de Janeiro/2024
    );
    
    if (success) {
      console.log('Relatório de janeiro baixado!');
      // Arquivo: consolidado_2024-01_2024-04-17.csv
    }
  };

  return <button onClick={handleDownloadReport}>Download Janela</button>;
}
```

### Exemplo 3: Exportar todos os dados (sem filtro por mês)

```typescript
// Sem passar mês = exporta TODOS os dados
exportEarningsCSV(earnings);  // Todos os ganhos
exportExpensesCSV(expenses);  // Todas as despesas
exportConsolidatedCSV(earnings, expenses); // Tudo junto
```

### Exemplo 4: Exportar relatório fiscal (12 meses)

```typescript
import { exportFiscalReportCSV } from '@/lib/csvExport';
import { computeMonthlySummary, getLastNMonths } from '@/lib/calculations';

function AnnualReport({ earnings, expenses, maintenanceConfig }) {
  const handleFiscalExport = () => {
    const months = getLastNMonths('2024-04', 12); // Últimos 12 meses
    
    const summaries = months.map(m =>
      computeMonthlySummary(earnings, expenses, maintenanceConfig, m)
    ).filter(s => s.totalEarnings > 0 || s.totalExpenses > 0);

    const period = `${summaries[0]?.month} a ${summaries[summaries.length - 1]?.month}`;
    
    exportFiscalReportCSV(earnings, expenses, summaries, period);
    // Arquivo: relatorio_fiscal_2024-04-17.csv
  };

  return <button onClick={handleFiscalExport}>Exportar Fiscal</button>;
}
```

---

## 🔔 Push Notifications - Exemplos

### Exemplo 1: Setup básico em App.tsx

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

function AppContent() {
  const { user } = useAuth();
  
  // Setup automático de notificações
  usePushNotifications(user?.uid);

  return (
    <div>
      {/* resto do app */}
    </div>
  );
}
```

### Exemplo 2: Solicitar permissão com feedback ao usuário

```typescript
import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

function NotificationSettings() {
  const { requestPermission } = usePushNotifications(userId);
  const [status, setStatus] = useState<string | null>(null);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    
    if (granted) {
      setStatus('✅ Notificações ativadas! Você receberá alertas de metas.');
    } else {
      setStatus('❌ Notificações bloqueadas. Verifique as permissões do navegador.');
    }
  };

  return (
    <div>
      <button onClick={handleEnableNotifications}>
        Ativar Notificações
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
```

### Exemplo 3: Notificar quando meta mensal é atingida

```typescript
import { useMemo } from 'react';
import { useMonthlyGoalNotification } from '@/hooks/usePushNotifications';

function Dashboard({ earnings, goals }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Calcular ganhos do mês
  const earningsThisMonth = useMemo(() => {
    return earnings
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [earnings, currentMonth]);

  // Notificar quando atinge a meta
  useMonthlyGoalNotification(
    earningsThisMonth,
    goals.earningGoal,
    () => {
      // Callback optonal quando meta é atingida
      console.log('🎉 Meta atingida! Mostrar confete?');
    }
  );

  return (
    <div>
      <h2>Ganhos este mês: R$ {earningsThisMonth.toFixed(2)}</h2>
      <p>Meta: R$ {goals.earningGoal.toFixed(2)}</p>
    </div>
  );
}
```

### Exemplo 4: Setup de listener para notificações em foreground

```typescript
import { useEffect } from 'react';
import { setupForegroundMessageListener } from '@/lib/messaging';

function NotificationListener() {
  useEffect(() => {
    // Quando app está aberto e notificação chega
    const unsubscribe = setupForegroundMessageListener(({ title, body, data }) => {
      console.log(`Notificação recebida: ${title}`);
      console.log(`Corpo: ${body}`);
      console.log('Dados:', data);

      // Você pode processar aqui:
      // - Mostrar toast customizado
      // - Atualizar UI
      // - Tocar som
      // - Rastrear evento
    });

    return () => unsubscribe?.();
  }, []);

  return null;
}
```

### Exemplo 5: Backend - Enviar notificação de meta atingida

```typescript
// Cloud Function (Node.js + Firebase Admin SDK)
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const notifyMonthlyGoalReached = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const userId = context.auth.uid;
  const { fcmToken, goalAmount } = data;

  try {
    // Enviar notificação
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Meta Mensal Atingida! 🎉',
        body: `Parabéns! Você atingiu R$ ${goalAmount.toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        })}`,
      },
      data: {
        type: 'goal_reached',
        userId: userId,
        timestamp: new Date().toISOString(),
      },
      webpush: {
        fcmOptions: {
          link: '/dashboard',
        },
      },
    });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Erro ao enviar notificação');
  }
});
```

---

## 🎯 Daily Goal Widget - Exemplos

### Exemplo 1: Usar no Dashboard

```typescript
import { Dashboard } from '@/components/Dashboard';
import { DailyGoalWidget } from '@/components/DailyGoalWidget';

export function AppDashboard({ data, summary }) {
  return (
    <div className="space-y-6">
      {/* Ver quanto falta para a meta do dia */}
      <DailyGoalWidget
        earnings={data.earnings}
        goals={data.goals}
        theme={data.theme}
      />

      {/* Dashboard existente */}
      <Dashboard
        summary={summary}
        prevSummary={prevSummary}
        goals={data.goals}
        earnings={data.earnings}
        expenses={data.expenses}
        maintenanceConfig={data.maintenanceConfig}
        month={month}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
```

### Exemplo 2: Widget desaparece se sem meta

```typescript
// O widget automaticamente retorna null se goals.earningGoal <= 0
// Isso significa que aparece apenas quando existe uma meta definida

function MyPage() {
  const [goals, setGoals] = useState({ earningGoal: 0, expenseLimit: 0 });

  return (
    <div>
      {/* Widget NÃO aparece aqui (earningGoal = 0) */}
      <DailyGoalWidget earnings={earnings} goals={goals} theme="dark" />

      {/* Mas aparece aqui (earningGoal = 3000) */}
      <DailyGoalWidget 
        earnings={earnings} 
        goals={{ earningGoal: 3000, expenseLimit: 1000 }} 
        theme="dark" 
      />
    </div>
  );
}
```

### Exemplo 3: Customizar widget

Se quiser mudar cores ou layout, editar `DailyGoalWidget.tsx`:

```typescript
// Para mudar cor quando meta é atingida
// Procure por: `isTodayComplete ? 'text-emerald-400' : 'text-slate-400'`
// E mude as cores Tailwind conforme desejado

// Para mudar mensagens
// Procure por: 'Meta do dia atingida!'
// E customize o texto
```

---

## 🔗 Integração Completa - Exemplo

Aqui está como todos os 3 recursos funcionam juntos:

```typescript
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDataFirebase } from '@/hooks/useAppDataFirebase';
import { usePushNotifications, useMonthlyGoalNotification } from '@/hooks/usePushNotifications';
import { exportEarningsCSV, exportExpensesCSV } from '@/lib/csvExport';
import { DailyGoalWidget } from '@/components/DailyGoalWidget';

export function CompleteExample() {
  const { user } = useAuth();
  const { data } = useAppDataFirebase();
  const { toast } = useToast();

  // 1️⃣ Setup notificações push
  usePushNotifications(user?.uid);

  // 2️⃣ Calcular ganhos do mês
  const currentMonth = new Date().toISOString().slice(0, 7);
  const earningsThisMonth = useMemo(() => {
    return data.earnings
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [data.earnings, currentMonth]);

  // 3️⃣ Disparar notificação quando meta é atingida
  useMonthlyGoalNotification(earningsThisMonth, data.goals.earningGoal);

  // 4️⃣ Funções de exportação
  const handleExportMonthly = () => {
    const success = exportConsolidatedCSV(data.earnings, data.expenses, currentMonth);
    toast(success ? 'Exportado!' : 'Erro', success ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      {/* 🎯 Widget mostra quanto falta para meta de hoje */}
      <DailyGoalWidget
        earnings={data.earnings}
        goals={data.goals}
        theme={data.theme}
      />

      {/* 📊 Botão para exportar dados */}
      <button onClick={handleExportMonthly}>
        Exportar Relatório
      </button>

      {/* Rest of UI */}
    </div>
  );
}
```

---

## ⚠️ Erros Comuns

### ❌ Erro: "Widget não aparece"
```typescript
// ✅ CORRETO - Goal definida
<DailyGoalWidget goals={{ earningGoal: 5000 }} ... />

// ❌ ERRADO - Goal = 0
<DailyGoalWidget goals={{ earningGoal: 0 }} ... />
```

### ❌ Erro: "CSV vazio"
```typescript
// ✅ CORRETO - Dados existem
exportEarningsCSV(earnings, '2024-04'); // se há dados em abril

// ❌ ERRADO - Sem dados
exportEarningsCSV([], '2024-04'); // retorna false
```

### ❌ Erro: "Notificação não funciona"
```typescript
// ✅ CORRETO
usePushNotifications(user?.uid); // em component que renderiza

// ❌ ERRADO
usePushNotifications(null); // sem uid, não funciona
```

---

## 📚 Documentação Relacionada

- `IMPLEMENTATION_GUIDE.md` - Guia de integração completo
- `PUSH_NOTIFICATIONS_SETUP.md` - Setup específico de FCM
- `src/lib/csvExport.ts` - Código source de CSV
- `src/lib/messaging.ts` - Código source de FCM
- `src/hooks/usePushNotifications.ts` - Hooks React
- `src/components/DailyGoalWidget.tsx` - Component React

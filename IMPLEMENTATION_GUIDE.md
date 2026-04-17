# Guia de Implementação - Novos Recursos

Este documento descreve os 3 novos recursos implementados no projeto Uber Driver Finance.

---

## 1. CSV Export (Excel-Compatible)

### O que foi implementado
- Exportação de dados em formato **CSV** (não PDF)
- Compatibilidade total com Excel e Google Sheets
- Codificação UTF-8 com BOM para garantir acentos corretos
- Suporte a escape de caracteres especiais (aspas, quebras de linha, vírgulas)
- 4 tipos de exportação:
  - **Ganhos do mês** - Dados de earnings
  - **Gastos do mês** - Dados de expenses  
  - **Consolidado** - Earnings + Expenses juntos
  - **Relatório Fiscal** - Resumo dos últimos 12 meses

### Arquivos criados
- `src/lib/csvExport.ts` - Funções de exportação CSV

### Como usar
```typescript
import { 
  exportEarningsCSV, 
  exportExpensesCSV, 
  exportConsolidatedCSV,
  exportFiscalReportCSV 
} from '@/lib/csvExport';

// Exportar ganhos do mês
const success = exportEarningsCSV(earnings, '2024-04');

// Exportar gastos
const success = exportExpensesCSV(expenses, '2024-04');

// Exportar consolidado
const success = exportConsolidatedCSV(earnings, expenses, '2024-04');

// Exportar relatório fiscal (12 meses)
const success = exportFiscalReportCSV(earnings, expenses, summaries, 'Abril 2024 a Março 2025');
```

### Características
✅ Valores monetários em formato decimal (2 casas)  
✅ Datas em formato DD/MM/AAAA  
✅ Nomes de categorias em português  
✅ Nomes de plataformas traduzidas  
✅ Inclui resumos e totalizações  
✅ BOM UTF-8 para Excel (acentos funcionam corretamente)  

---

## 2. Push Notifications (FCM - Firebase Cloud Messaging)

### O que foi implementado
- Setup completo de **Firebase Cloud Messaging (FCM)**
- Requisição de permissão de notificações do navegador
- Service Worker para receber mensagens em background
- Display de notificações em foreground (quando app está aberto)
- Listener para mensagens em background
- Armazenamento do token FCM no Firestore

### Arquivos criados
- `src/lib/messaging.ts` - Funções core de FCM
- `src/hooks/usePushNotifications.ts` - Hook React para notificações
- `public/firebase-messaging-sw.js` - Service Worker

### Configuração necessária no .env
```env
VITE_FIREBASE_FCM_VAPID_KEY=seu_vapid_key_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
```

### Onde obter as credenciais
1. Ir para [Firebase Console](https://console.firebase.google.com/)
2. Selecionar o projeto
3. Ir para **Configurações do Projeto**
4. Abrir aba **Cloud Messaging**
5. Copiar **Chave pública (VAPID)**
6. Copiar **ID do remetente**

### Como usar

**Inicializar notificações (em um useEffect)**
```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function MyComponent() {
  const { user } = useAuth();
  usePushNotifications(user?.uid);
  
  return <div>Notificações configuradas!</div>;
}
```

**Monitorar meta mensal e notificar quando atingida**
```typescript
import { useMonthlyGoalNotification } from '@/hooks/usePushNotifications';

const earningsThisMonth = /* cálculo */;
useMonthlyGoalNotification(earningsThisMonth, monthlyGoal, () => {
  console.log('Meta mensal atingida!');
  // Aqui você pode fazer algo quando a meta for alcançada
});
```

### Como enviar notificações do backend

Usar Firebase Admin SDK (Node.js):

```javascript
// Enviar para um usuário específico
admin.messaging().send({
  token: userToken, // FCM token salvo no Firestore
  notification: {
    title: 'Meta Mensal Atingida!',
    body: 'Parabéns! Você atingiu sua meta mensal de R$ 8.000',
  },
  data: {
    action: 'goal_reached',
    goal: '8000',
    url: '/dashboard',
  },
  webpush: {
    fcmOptions: {
      link: '/dashboard',
    },
  },
});
```

### Fluxo de funcionamento
1. ✅ App inicia → `usePushNotifications()` solicita permissão
2. ✅ Usuário aprova → Browser armazena token
3. ✅ Token é salvo no Firestore (em `users/{uid}/fcmToken`)
4. ✅ Backend pode enviar mensagens para esse token
5. ✅ Se app está aberto → Listener em foreground mostra notificação
6. ✅ Se app está fechado → Service Worker recebe e mostra notificação

---

## 3. Daily Goal Widget (Dashboard)

### O que foi implementado
- Widget visual mostrando **progresso de meta do dia**
- Exibe quanto falta para atingir a meta diária
- Cálculo automático de meta diária (meta mensal / 30 dias)
- Mostra também progresso do mês
- Animações e cores que mudam quando meta é atingida
- Suporte a tema claro e escuro
- Só aparece se uma meta foi definida

### Arquivo criado
- `src/components/DailyGoalWidget.tsx` - Componente React

### Como usar

**Adicionar ao Dashboard**
```typescript
import { DailyGoalWidget } from '@/components/DailyGoalWidget';

export function Dashboard({ earnings, goals, theme }) {
  return (
    <div>
      <DailyGoalWidget 
        earnings={earnings}
        goals={goals}
        theme={theme}
      />
      {/* resto do conteúdo */}
    </div>
  );
}
```

### Características

**Visual**
- 📊 Barra de progresso animada
- 🎯 Mostra meta do dia vs ganhos atuais
- 📈 Mostra meta do mês vs ganhos do mês
- ✨ Ícones e cores semânticas
- 🎉 Mensagem especial quando meta é atingida

**Dados exibidos**
- Ganhos de hoje / Meta diária
- Percentual de progresso do dia
- Quanto falta em R$
- Ganhos do mês / Meta mensal
- Percentual de progresso do mês

### Comportamento
- Se `earningsToday >= dailyGoal` → Mostra verde e "Meta do dia atingida!"
- Se `earningsThisMonth >= monthlyGoal` → Mostra "Meta do mês atingida! 🎉"
- Atualiza em tempo real conforme novos ganhos são adicionados
- Desaparece se nenhuma meta foi definida

---

## Checklist de Integração

### ✅ CSV Export
- [x] Arquivo `csvExport.ts` criado
- [x] Funções de export implementadas
- [x] App.tsx atualizado para usar CSV
- [x] Botões no UI atualizados
- [x] BOM UTF-8 adicionado

### ✅ Push Notifications
- [ ] **IMPORTANTE**: Gerar credenciais FCM no Firebase Console
- [ ] **IMPORTANTE**: Adicionar `VITE_FIREBASE_FCM_VAPID_KEY` ao `.env`
- [x] Arquivo `messaging.ts` criado
- [x] Hook `usePushNotifications.ts` criado
- [x] Service Worker `firebase-messaging-sw.js` criado
- [x] App.tsx inicializa notificações
- [ ] Backend configurado para enviar notificações (se aplicável)

### ✅ Daily Goal Widget
- [x] Componente `DailyGoalWidget.tsx` criado
- [x] Integrado ao Dashboard
- [x] Suporta temas claro/escuro
- [x] Lógica de cálculo implementada

---

## Variáveis de Ambiente Necessárias

Adicionar ao `.env`:
```env
# Existentes
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# NOVO - Para FCM
VITE_FIREBASE_FCM_VAPID_KEY=...
```

---

## Testing

### Testar CSV Export
1. Adicionar alguns ganhos/gastos
2. Ir para Config > Exportar Dados
3. Clicar em "Ganhos do mês (CSV)"
4. Abrir arquivo em Excel/Google Sheets
5. Verificar acentos, valores e formatação

### Testar Push Notifications
1. Em DevTools, abrir Console
2. Verificar se não há erros de FCM
3. Permitir notificações quando solicitado
4. Abrir app em outra aba
5. Enviar notificação de teste (Firebase Console)
6. Verificar se notificação aparece

### Testar Daily Goal Widget
1. Ir para Config e definir meta mensal (ex: R$ 3.000)
2. Voltar ao Dashboard
3. Ver Daily Goal Widget aparecer
4. Adicionar alguns ganhos
5. Widget atualiza em tempo real
6. Quando ganho >= meta diária → Widget muda de cor

---

## Notas Importantes

📌 **CSV Export**
- Usa BOM UTF-8 para melhor compatibilidade com Excel
- Todos os valores são salvos com 2 casas decimais
- Nomes de meses em português brasileiro
- Categorias e plataformas traduzidas

📌 **Push Notifications**
- Requer HTTPS em produção (localStorage para desenvolviment…)
- Necessário criar credenciais FCM no Firebase Console
- Service Worker deve estar em `public/` para funcionar
- Token deve ser armazenado para envios direcionados

📌 **Daily Goal Widget**
- Cálculo de meta diária: `meta_mensal / 30`
- Atualiza conforme novos earnings são adicionados
- Aparece apenas se `goals.earningGoal > 0`
- Funciona com dados em tempo real via Firestore listeners

---

## Próximos Passos (Opcional)

- [ ] Implementar notificação quando usuário atinge 50% e 80% da meta
- [ ] Cache de token FCM no localStorage
- [ ] Notificação de lembretes diários
- [ ] Exportar com gráficos (Excel com tabelas dinâmicas)
- [ ] Integração com Google Drive para backup automático de CSVs
- [ ] Relatório visual em PDF (manter PDF+CSV)

# Guia Rápido de Setup - Notificações Push

Este guia lista o mínimo necessário para configurar Push Notifications com Firebase Cloud Messaging.

## 1. Gerar Credenciais FCM

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Clique em **⚙️ Configurações do Projeto** (canto superior direito)
4. Abra a aba **Cloud Messaging**
5. Copie:
   - **Chave pública (VAPID)** → `VITE_FIREBASE_FCM_VAPID_KEY`
   - **ID do remetente** → `VITE_FIREBASE_MESSAGING_SENDER_ID` (geralmente já preenchido)

## 2. Adicionar variável ao .env

```env
VITE_FIREBASE_FCM_VAPID_KEY=<sua_chave_vapid_aqui>
```

## 3. Verificar Service Worker

O arquivo `public/firebase-messaging-sw.js` já foi criado. Se não estiver lá, criar com o conteúdo em `src/docs/firebase-messaging-sw.js`.

## 4. Testar

```bash
npm run dev
```

1. Abrir app no navegador
2. Verificar Console para mensagens de FCM
3. Permitir notificações quando solicitado
4. Verificar Se o token FCM foi salvo no Firestore:
   - Firebase Console → Firestore → `users/{uid}` 
   - Deve ter campo `fcmToken` preenchido

## 5. Enviar Notificação de Teste (Backend)

Se usar Node.js com Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');

// Initialize Admin SDK (já deve estar inicializado)
const messagingRef = admin.messaging();

// Enviar para token específico
await messagingRef.send({
  token: fcmToken,
  notification: {
    title: 'Teste',
    body: 'Notificação de teste',
  },
});
```

Ou usar **Firebase Console**:
1. Cloud Messaging
2. Clique em **Enviar a primeira mensagem**
3. Preencha Title e Body
4. Clique em **Enviar**

## 6. Firestore Rules Update

Adicionar à `firestore.rules` (já foi adicionado, mas verificar):

```firestore
// Users com FCM token
match /users/{userId} {
  allow read: if isOwner(userId);
  allow write: if isOwner(userId);
}
```

Já está configurado, sem mudanças necessárias.

---

## Troubleshooting

### ❌ Erro: "FCM not supported"
→ Seu navegador não suporta FCM (tente Chrome, Edge, Firefox)

### ❌ Erro: "Permission denied"
→ Usuário recusou notificações. Permitir novamente nas configurações do navegador.

### ❌ Token não aparece no Firestore
→ Verificar:
- `.env` tem `VITE_FIREBASE_FCM_VAPID_KEY` correto?
- Service Worker está em `public/firebase-messaging-sw.js`?
- Notificações foram permitidas pelo usuário?
- Console mostra erros?

### ❌ Notificação não chega
→ Verificar:
- Token é válido? (copiar do Firestore e testar)
- Firebase Console → Cloud Messaging → Enviar mensagem de teste
- Usando token correto no backend?

---

## Integração no Backend (Exemplo Node.js)

Para enviar notificações quando meta é atingida:

```javascript
// Exemplo: Firebase Cloud Function
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.notifyGoalReached = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const prevData = change.before.data();

    // Se earnings do mês subiu para >= meta
    if (newData.earningsThisMonth >= newData.goals.earningGoal && 
        prevData.earningsThisMonth < newData.goals.earningGoal) {
      
      // Enviar notificação
      await admin.messaging().send({
        token: newData.fcmToken,
        notification: {
          title: 'Meta Mensal Atingida! 🎉',
          body: `Parabéns! Você atingiu R$ ${newData.earningsThisMonth.toFixed(2)}`,
        },
        data: {
          type: 'goal_reached',
          earnings: String(newData.earningsThisMonth),
        },
      });
    }
  });
```

---

## Próximo: Configurar Lembretes Diários

Para enviar lembretes diários (ex: 8 AM), usar Cloud Scheduler + Cloud Function:

```javascript
exports.sendDailyReminder = functions.pubsub
  .schedule('0 8 * * *') // Todo dia às 8h
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    // Buscar usuários com notificações ativas
    const users = await admin.firestore().collection('users')
      .where('remindersEnabled', '==', true)
      .get();

    const messages = users.docs.map(doc => ({
      token: doc.data().fcmToken,
      notification: {
        title: 'Bom dia! 👋',
        body: 'Hora de registrar seus ganhos e gastos do dia.',
      },
    }));

    await admin.messaging().sendAll(messages);
  });
```

---

## Documentação Oficial
- [Firebase FCM - Web](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Firebase Admin SDK - Messaging](https://firebase.google.com/docs/reference/admin/node/admin.messaging)
- [Service Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

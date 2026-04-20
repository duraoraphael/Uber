# 📋 FIRESTORE RULES — CONSOLIDAÇÃO & DEPLOYMENT

**Data:** 2026-04-20  
**Status:** ✅ Consolidado em arquivo único

---

## 📦 Arquivos Firestore

### ✅ ÚNICO ARQUIVO DE PRODUÇÃO:
- **`firestore.rules`** — Arquivo principal, completo e documentado
  - Contém TODAS as regras de segurança
  - Bem documentado com comentários explicativos
  - Pronto para deployment

### 📁 ARQUIVO HISTÓRICO (pode ser removido):
- **`firestore.rules.secure`** — Versão anterior, mantido para referência
  - Contém as mesmas regras
  - Pode ser deletado ou arquivado

---

## 🚀 Como Fazer Deploy

### Opção 1: Deploy via Firebase CLI (Recomendado)

```bash
# Fazer deploy apenas das regras Firestore
firebase deploy --only firestore:rules

# Output esperado:
# ✔  firestore:rules
# ✔  Deploy complete!
```

### Opção 2: Deploy completo (regras + functions + hosting)

```bash
# Deploy tudo
firebase deploy

# Ou deploy seletivo:
firebase deploy --only firestore:rules,firestore:indexes
```

### Opção 3: Testar regras localmente

```bash
# Iniciar emulator local
firebase emulators:start

# Em outro terminal, rodar testes
firebase emulators:exec "npm test"
```

---

## 📋 Estrutura das Regras

```
firestore.rules
├── Helper Functions
│   ├── isOwner(userId) — Verifica autenticação e ownership
│   └── isValidUserId(userId) — Valida formato do userId
│
├── Validation Functions
│   ├── isValidEarning(data) — Valida documento de ganho
│   ├── isValidExpense(data) — Valida documento de gasto
│   └── isValidUserProfile(data) — Valida perfil do usuário
│
├── Security Rules
│   ├── /users/{userId} — Perfil do usuário
│   ├── /users/{userId}/earnings/{docId} — Ganhos
│   ├── /users/{userId}/expenses/{docId} — Gastos
│   └── /{document=**} — Bloqueia tudo mais
│
└── Documentação — Comentários explicativos
```

---

## 🔒 Segurança Implementada

### Princípios de Segurança:

1. **Ownership Check** ✅
   - Cada usuário só acessa seus próprios dados
   - `isOwner(userId)` verifica em toda operação

2. **Data Validation** ✅
   - Tipos de dados verificados (string, number, map)
   - Formatos validados (datas em YYYY-MM-DD)
   - Limites estabelecidos (amount max 10.000, etc)

3. **Field Enforcement** ✅
   - Earnings: date, platform, amount, hours, km
   - Expenses: date, category, amount, description
   - Validação garante que dados são sempre válidos

4. **Partial Updates** ✅
   - Usuário pode atualizar apenas theme
   - Não precisa re-enviar todos os campos
   - Flexibilidade com segurança

5. **Catch-All Rule** ✅
   - `/{document=**}` nega tudo o mais
   - Nenhum outro path é acessível
   - Defense in depth

---

## 📊 Limites Estabelecidos

### Earnings (Ganhos)

| Campo | Min | Max | Descrição |
|-------|-----|-----|-----------|
| amount | 0 | 10.000 R$ | Limite diário realista |
| hours | 0 | 24h | Não ultrapassa um dia |
| km | 0 | 1.000 km | Limite por entrada |

### Expenses (Gastos)

| Campo | Min | Max | Descrição |
|-------|-----|-----|-----------|
| amount | 0 | 10.000 R$ | Limite realista |
| description | — | 200 chars | Limita tamanho |

### Categories (Categorias)

Validadas como enum:
- `combustivel` — Combustível
- `alimentacao` — Alimentação
- `taxas` — Taxas/Impostos
- `lavagem` — Lavagem de veículo
- `outros` — Outros gastos

### Platforms (Plataformas)

Validadas como enum:
- `uber` — Uber
- `99` — 99
- `outros` — Outras plataformas

---

## ✅ Checklist de Deployment

- ✅ Regras consolidadas em arquivo único
- ✅ Regras bem documentadas
- ✅ Validação de dados implementada
- ✅ Segurança de ownership verificada
- ✅ Limites realistas estabelecidos
- ⏳ Testes de regras (recomendado)

### Antes de fazer deploy:

```bash
# 1. Verificar sintaxe
firebase validate

# 2. Fazer deploy em staging primeiro
firebase deploy --project=driveFinance-staging --only firestore:rules

# 3. Testar no staging

# 4. Deploy em produção
firebase deploy --only firestore:rules
```

---

## 🔍 Validação de Dados

### Exemplo: Criar um Earning

```javascript
// ✅ VÁLIDO
{
  date: "2026-04-20",
  platform: "uber",
  amount: 250,
  hours: 8,
  km: 120
}

// ❌ INVÁLIDO - amount muito alto
{
  date: "2026-04-20",
  platform: "uber",
  amount: 15000,  // > 10.000
  hours: 8,
  km: 120
}

// ❌ INVÁLIDO - data em formato errado
{
  date: "20/04/2026",  // não é YYYY-MM-DD
  platform: "uber",
  amount: 250,
  hours: 8,
  km: 120
}

// ❌ INVÁLIDO - plataforma não reconhecida
{
  date: "2026-04-20",
  platform: "iFood",  // não é válido
  amount: 250,
  hours: 8,
  km: 120
}
```

### Exemplo: Criar um Expense

```javascript
// ✅ VÁLIDO
{
  date: "2026-04-20",
  category: "combustivel",
  amount: 150,
  description: "Abasteci 40 litros"
}

// ❌ INVÁLIDO - descrição muito longa
{
  date: "2026-04-20",
  category: "combustivel",
  amount: 150,
  description: "Esta é uma descrição muito longa que ultrapassa o limite de 200 caracteres..."  // > 200
}

// ❌ INVÁLIDO - category não válida
{
  date: "2026-04-20",
  category: "seguro",  // não é válido
  amount: 150,
  description: "Seguro do veículo"
}
```

---

## 📝 Comandos Úteis

```bash
# Ver regras ativas no Firebase
firebase firestore:rules

# Testar regras (SDK de testes)
firebase emulators:start

# Fazer rollback de regras
firebase rollback

# Ver histórico de deploys
firebase functions:log

# Validar arquivo antes de deploy
firestore-rules-validator firestore.rules
```

---

## 🛠️ Manutenção das Regras

### Quando Modificar:

1. **Novos campos em Earning/Expense**
   - Adicionar em `isValidEarning()` ou `isValidExpense()`
   - Atualizar documentação
   - Testar antes de deploy

2. **Novos tipos de Categoria/Platform**
   - Adicionar no array de validação
   - Exemplo: `'categoria' in ['cat1', 'cat2', 'newCat']`

3. **Novos Limits**
   - Modificar os números em validação
   - Documentar razão da mudança
   - Avisar aos usuários se restringe funcionalidade

### Exemplo: Adicionar Nova Categoria

```firestore
// ANTES:
&& data.category in ['combustivel', 'alimentacao', 'taxas', 'lavagem', 'outros']

// DEPOIS: (adiciona 'seguro')
&& data.category in ['combustivel', 'alimentacao', 'taxas', 'lavagem', 'seguro', 'outros']
```

---

## 📚 Referências

- Firebase Docs: https://firebase.google.com/docs/firestore/security/rules-syntax
- Rules Playground: https://firebase.google.com/docs/firestore/security/get-started
- Best Practices: https://firebase.google.com/docs/firestore/security/best-practices

---

## ✨ Resumo

| Aspecto | Status |
|--------|--------|
| Consolidação | ✅ Único arquivo |
| Documentação | ✅ Completa |
| Segurança | ✅ Robusta |
| Flexibilidade | ✅ Partial updates |
| Validação | ✅ Rigorosa |
| Deployment | ✅ Pronto |

**Próximo passo:** `firebase deploy --only firestore:rules`

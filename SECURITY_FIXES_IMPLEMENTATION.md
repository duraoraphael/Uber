# 🔧 SECURITY FIXES - Guia de Implementação

**Status**: 🚨 CRÍTICO - Implementar IMEDIATAMENTE  
**Data**: 2026-04-17  
**Prioridade**: MÁXIMA

---

## ⚡ QUICK START - Passo a Passo

### Fase 1: Emergência (HOJE)

#### 1.1 🚨 Revogar API Keys Expostas

```bash
# 1. Groq - Acesse https://console.groq.com
#    → Settings → Delete/Revoke a API key
#    → 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

# 2. Firebase - Acesse https://console.firebase.google.com
#    → Project Settings → Service Accounts
#    → Generate new private key (vai desativar a atual)

# 3. Recriar .env com novas chaves em:
#    → https://console.firebase.google.com → Project Settings
#    → Copiar values novos
```

#### 1.2 🗑️ Remover .env do Git

```bash
cd c:\Users\durao\OneDrive\Documentos\Uber

# Remover do staging
git rm --cached .env

# Remover do histórico completo (WARNING: affects all branches)
# OPÇÃO 1: BFG Repo-Cleaner (mais seguro)
npm install -g bfg
bfg --delete-files .env

# OPÇÃO 2: git filter-branch (cuidado)
git filter-branch --tree-filter 'rm -f .env' HEAD

# Fazer commit
git add .gitignore
git commit -m "🔒 Security: Remove exposed .env from git history"

# Força push (se em repositório privado)
git push origin --force --all
```

#### 1.3 🛡️ Configurar .gitignore

```bash
cat >> .gitignore << 'EOF'
# Environment variables - NUNCA commitar
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# Credentials and keys
*.pem
*.key
*.jks
credentials.json
firebase-key.json

# IDE
.vscode/*
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~
EOF

git add .gitignore
git commit -m "chore: Update .gitignore with sensitive files"
```

### Fase 2: Instalar Dependências (1 hora)

```bash
# Core security
npm install dompurify isomorphic-dompurify
npm install --save-dev @types/dompurify

# Verificar vulnerabilidades
npm audit

# Verificar se instalou
npm ls dompurify
```

### Fase 3: Aplicar Fixes (2-3 horas)

#### 3.1 Copiar novos arquivos

Mais novos arquivos foram criados:
- ✅ `src/lib/validation.ts` - Input validation
- ✅ `src/lib/sanitize.ts` - XSS protection
- ✅ `firestore.rules.secure` - Regras de segurança

```bash
# Verificar se os arquivos foram criados
ls -la src/lib/validation.ts
ls -la src/lib/sanitize.ts
ls -la firestore.rules.secure
```

#### 3.2 Atualizar firestore.rules

```bash
# Fazer backup
cp firestore.rules firestore.rules.backup

# Substituir
cp firestore.rules.secure firestore.rules
```

#### 3.3 Atualizar InsightsPanel.tsx

Remover:
```typescript
// ❌ ANTES
function MarkdownRenderer({ markdown }: { markdown: string }) {
  const html = markdownToHtml(markdown);
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />  // ❌ PERIGO
  );
}
```

Adicionar:
```typescript
// ✅ DEPOIS
import { markdownToSafeHtml } from '../lib/sanitize';

function MarkdownRenderer({ markdown }: { markdown: string }) {
  const safeHtml = markdownToSafeHtml(markdown);
  return (
    <div
      className="prose-gemini text-sm text-slate-200"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
```

#### 3.4 Adicionar Validação em LoginScreen.tsx

```typescript
// Adicionar import
import { validatePassword, validateEmail } from '../lib/validation';

// No handleSubmit
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // ✅ Validar password se SignUp
    if (isSignUp) {
      const pwdValidation = validatePassword(password);
      if (!pwdValidation.valid) {
        setError(pwdValidation.error || 'Senha fraca');
        setLoading(false);
        return;
      }
    }

    // ✅ Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Email inválido');
      setLoading(false);
      return;
    }

    // ... resto do código
  } catch (err) {
    setError(getFriendlyError(err));
  } finally {
    setLoading(false);
  }
}
```

#### 3.5 Adicionar Validação em EarningsForm.tsx

```typescript
// Import
import { validateEarningData } from '../lib/validation';

// No handleSubmit
function handleSubmit(e: FormEvent) {
  e.preventDefault();
  
  // ✅ Validar dados
  const validation = validateEarningData({
    date,
    platform,
    amount: Number(amount),
    hours: Number(hours) || 0,
    km: Number(km) || 0,
  });

  if (!validation.valid) {
    // Mostrar erro
    console.error('Validation errors:', validation.errors);
    // toast com erro
    return;
  }

  const data = {
    date,
    platform,
    amount: Number(amount),
    hours: Number(hours) || 0,
    km: Number(km) || 0,
  };

  if (editingId) {
    onUpdate(editingId, data);
  } else {
    onAdd(data);
  }
  resetForm();
}
```

### Fase 4: Testar (1 hora)

```bash
# 1. Testes de validação
npm run dev

# 2. Testar XSS (tentar injetar no Insights)
# Input: <script>alert('XSS')</script> ou <img src=x onerror="alert('XSS')">
# Esperado: Script não executa

# 3. Testar password validation
# Input: "123456" → Deve rejeitar
# Input: "MyPass@2024" → Deve aceitar

# 4. Script injection em forms
# Tentar adicionar earning com amount = text
# Esperado: Erro de validação

# Testes de segurança
npm audit  # Deve passar

# Build test
npm run build  # Deve completar sem erros
```

### Fase 5: Deploy Firebase Rules (30 min)

```bash
# 1. Fazer login
firebase login

# 2. Selecionar projeto
firebase use drivefinance-9c961

# 3. Deploy apenas das rules (SEM fazer deploy da web app ainda)
firebase deploy --only firestore:rules

# ✅ Ou via Firebase Console
# Console → Firestore Database → Rules → Copy/Paste from firestore.rules
```

### Fase 6: Deploy da Aplicação (30 min)

```bash
# Build
npm run build

# Preview local
npm run preview

# Deploy para Firebase Hosting
firebase deploy --only hosting:drivefinance-9c961

# OU se não tiver CI/CD configurado
firebase deploy --only hosting
```

---

## 📋 Arquivos Modificados / Criados

| Arquivo | Status | Ação |
|---------|--------|------|
| `.env` | 🗑️ Remover | Deletar do git |
| `.gitignore` | ✏️ Atualizar | Adicionar .env |
| `firestore.rules` | ✏️ Substituir | Copiar de `firestore.rules.secure` |
| `src/lib/validation.ts` | ✅ Novo | Adicionar arquivo |
| `src/lib/sanitize.ts` | ✅ Novo | Adicionar arquivo |
| `src/components/InsightsPanel.tsx` | ✏️ Modificar | Usar `markdownToSafeHtml` |
| `src/components/LoginScreen.tsx` | ✏️ Modificar | Adicionar validação |
| `src/components/EarningsForm.tsx` | ✏️ Modificar | Adicionar validação |
| `vite.config.ts` | ✏️ Modificar | Adicionar CSP headers |

---

## 🔒 Checklist de Implementação

### Emergência (Hoje)
- [ ] Revogar todas as API keys no console
- [ ] Remover .env do Git com BFG Repo-Cleaner
- [ ] Criar novo .env com chaves novas
- [ ] Commit: "🔒 Security: Remove exposed credentials"

### Código (Próximas 48h)
- [ ] npm install dompurify
- [ ] Copiar `src/lib/validation.ts`
- [ ] Copiar `src/lib/sanitize.ts`
- [ ] Atualizar `InsightsPanel.tsx`
- [ ] Atualizar `LoginScreen.tsx`
- [ ] Atualizar `EarningsForm.tsx`
- [ ] Atualizar `ExpensesForm.tsx`
- [ ] npm audit (resolver vulnerabilidades)
- [ ] npm run build (testar build)

### Firebase (Quando código estiver pronto)
- [ ] Copiar `firestore.rules.secure` para `firestore.rules`
- [ ] firebase deploy --only firestore:rules
- [ ] firebase deploy --only hosting

### Verificação Final
- [ ] npm audit --no-fund (0 vulnerabilidades)
- [ ] npm run build (sucesso)
- [ ] Testar senha fraca → Rejeita ✅
- [ ] Testar XSS no Insights → Bloqueia ✅
- [ ] Testar valores inválidos → Valida ✅
- [ ] .env não está em git → git log --all --full-history -- .env (vazio) ✅

---

## 🚀 Próximos Passos Pós-Deploy

### 1 Semana Depois
- [ ] CSP Headers no Firebase
- [ ] Rate limiting implementado
- [ ] Backend proxy para Groq API
- [ ] HTTPS-only enforcement

### 2 Semanas Depois
- [ ] OWASP ZAP security scan
- [ ] Penetration testing
- [ ] Audit logging setup
- [ ] Sentry error tracking

### 1 Mês Depois
- [ ] Security headers audit
- [ ] Dependency scanning (dependabot)
- [ ] WAF configuration
- [ ] Security training for team

---

## 📞 Suporte Rápido

### "meu build quebrou"
```bash
npm install # reinstalar
npm run build # testar novamente
```

### "Erro na validação"
```bash
# Verificar se arquivo foi copiado
ls -la src/lib/validation.ts

# Verificar imports no componente
grep -n "import.*validation" src/components/*.tsx
```

### "NÃO remova .env enquanto não tiver novas chaves!"

### "Teste offline antes de fazer push!"
```bash
git merge origin/main  # sync
npm install            # deps
npm run build          # compile
```

---

## 🔐 Regras de Ouro

1. **NUNCA commit .env** - Revogar chaves imediatamente
2. **Input validation sempre** - Validar no frontend E no backend
3. **Output sanitization sempre** - DOMPurify para qualquer HTML dinâmico
4. **Test security fixes** - Tentar quebrantar seu próprio código
5. **Keep dependencies updated** - npm audit regularmente

---

## 📊 Progresso

```
Fase 1: Emergência .......... [?]
Fase 2: Dependências ....... [?]
Fase 3: Código ............. [?]
Fase 4: Testes ............ [?]
Fase 5: Firebase .......... [?]
Fase 6: Deploy ........... [?]

Total: ............ [  E ]
```

**Tempo estimado**: 6-8 horas para todas as fases

---

Qualquer dúvida, refira-se a `SECURITY_AUDIT.md` para mais detalhes!

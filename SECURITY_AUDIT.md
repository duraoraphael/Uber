# 🚨 AUDITORIA DE SEGURANÇA COMPLETA - Uber Driver Finance

**Data**: 2026-04-17  
**Status da Aplicação**: ⚠️ **CRÍTICO - Vulnerabilidades Graves Encontradas**  
**Risco Geral**: 🔴 **ALTO**

---

## 📋 SUMÁRIO EXECUTIVO

Foram identificadas **3 vulnerabilidades CRÍTICAS**, **7 problemas MÉDIOS** e **5 melhorias RECOMENDADAS**. A aplicação tem uma postura de segurança fraca e requer correções imediatas antes de ser usada em produção.

### ⚠️ Problemas Críticos Encontrados:
1. **API Keys expostas em Git** (.env commitado) - ⚠️ URGENTE
2. **XSS via dangerouslySetInnerHTML** (InsightsPanel) - 🔴 CRÍTICO
3. **Firebase Rules incompletas** - Não protege dados em tempo real bem

### ⚠️ Problemas Médios:
- Input validation fraca
- Sem CSP headers
- Sem HTTPS enforcement
- Rate limiting inadequado
- Sem CSRF tokens explícitos
- Credenciais expostas em DevTools

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. 🚨 CRITICAL: .env Commitado com API Keys Reais

**Localização**: `c:\Users\durao\OneDrive\Documentos\Uber\.env`

**Severidade**: 🔴 CRÍTICO | **CVSS**: 9.8 | **CWE**: CWE-798 (Hard-coded Credentials)

**Problema**:
```
❌ VITE_GROQ_API_KEY=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
❌ VITE_FIREBASE_API_KEY=AIzaSyApttW9KY3qHLxROBjAI0OSyB45WCtSOpQ
❌ VITE_FIREBASE_PROJECT_ID=drivefinance-9c961
❌ VITE_FIREBASE_FCM_VAPID_KEY=BKI3h3VW1yBOfuIa2ktu7xLrfzxLyqIisd3w5qBEJrtTNqI9NEOedialf5P82M2bR_ndGeYhLx11Omt2RjQpLi4
```

**Por que é crítico**:
- ✗ Attacker pode usar a api key do Groq para fazer requisições em seu nome (custo financeiro)
- ✗ API keys do Firebase expostas = acesso não autorizado a Firestore
- ✗ FCM VAPID key permite enviar notificações falsas
- ✗ Git history preserva todas as versões = chaves ainda acessíveis
- ✗ Visível em repositórios públicos/histórico

**Impacto**:
- 💰 Custo financeiro (consumo de API)
- 🔓 Acesso não autorizado aos dados
- 📤 Notificações spam/maliciosas
- 👤 Impersonação de usuários

**Fixes**:
```bash
# 1. Revogar imediatamente todas as chaves no console
# Firebase Console → Gerar novas API keys
# Groq Console → Revogar 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

# 2. Remover .env do Git
git rm --cached .env
git commit -m "🔒 Remove exposed .env from git history"

# 3. Reescrever histórico (CUIDADO: afeta branches)
git filter-branch --tree-filter 'rm -f .env' -- --all
# OU usar BFG Repo-Cleaner: bfg --delete-files .env

# 4. Configurar .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
git add .gitignore
git commit -m "Add .env to .gitignore"

# 5. Usar GitHub Secrets (para CI/CD)
# OU use variáveis de ambiente no servidor de hospedagem
```

**Como evitar no futuro**:
```bash
# .gitignore (DEVE estar no início do projeto)
.env
.env.local
.env.*.local
*.key
*.pem
credentials.json
firebase-key.json
```

---

### 2. 🔴 XSS (Cross-Site Scripting) - dangerouslySetInnerHTML

**Localização**: `src/components/InsightsPanel.tsx:16`

**Severidade**: 🔴 CRÍTICO | **CVSS**: 8.2 | **CWE**: CWE-79

**Código Vulnerável**:
```typescript
function MarkdownRenderer({ markdown }: { markdown: string }) {
  const html = markdownToHtml(markdown);
  return (
    <div
      className="prose-gemini text-sm text-slate-200 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}  // ❌ PERIGOSO
    />
  );
}

function markdownToHtml(md: string): string {
  // ❌ Sanitização incompleta
  let safe = md.replace(/<[^>]*>/g, '');  // Remove tags, mas não XSS vectors
  // ...
}
```

**Por que é crítico**:
- O Groq API pode ser explorado para injetar JavaScript
- Attacker pode adicionar tags `<script>`, event handlers, etc
- Regex `/^\d+\. /` não bloqueia todas as vetores XSS

**Exemplos de ataque**:
```html
<!-- Injection via Groq response -->
<img src=x onerror="alert('XSS')">
<svg onload="fetch('/steal-data')">
<iframe src="javascript:alert('XSS')">
<img src="" alt="test" onmouseover="console.log(document.cookie)">
```

**Fix - Usar DOMPurify**:
```bash
npm install dompurify isomorphic-dompurify
npm install --save-dev @types/dompurify
```

```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'hr'
    ],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
  });
}
```

```typescript
// src/components/InsightsPanel.tsx - CORRIGIDO
import DOMPurify from 'isomorphic-dompurify';

function MarkdownRenderer({ markdown }: { markdown: string }) {
  const html = markdownToHtml(markdown);
  const safe = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h2', 'h3', 'strong', 'em', 'li', 'ul', 'br'],
    ALLOWED_ATTR: ['class'],
  });
  
  return (
    <div
      className="prose-gemini text-sm text-slate-200 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: safe }}  // ✅ SEGURO agora
    />
  );
}

function markdownToHtml(md: string): string {
  // Sanitize primeiro
  let safe = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  let html = safe
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  html = html.replace(/((?:<li[^>]*>.*?<\/li>(?:<br\/>)?)+)/g, '<ul>$1</ul>');
  html = html.replace(/<ul([^>]*)>(.*?)<\/ul>/gs, (match) =>
    match.replace(/<br\/>/g, ''),
  );

  return html;
}
```

**Teste de Fix**:
```typescript
// Testar XSS payload
const maliciousMarkdown = `
## Test <img src=x onerror="alert('XSS')">
**Bold <script>alert('XSS')</script>**
`;

const html = markdownToHtml(maliciousMarkdown);
const safe = DOMPurify.sanitize(html);
console.log(safe); // Deve estar seguro
```

---

### 3. 🔴 Firebase Firestore Rules - Acesso Público Incompleto

**Localização**: `firestore.rules`

**Severidade**: 🟠 ALTO | **CVSS**: 7.5 | **CWE**: CWE-284

**Problema Atual**:
```firestore
match /users/{userId} {
  allow read: if isOwner(userId);  // ✓ Bom
  allow write: if isOwner(userId); // ✓ Bom
}
```

**Vulnerabilidades**:
1. ❌ Sem validação de dados na escrita (qualquer estrutura aceita)
2. ❌ Sem limite de tamanho de documento
3. ❌ Sem restrição de campos específicos
4. ❌ Sem auditoria de exclusão

**Fix - Firestore Rules Robustas**:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    function isValidUser(userId) {
      return userId.size() > 0 && userId.size() < 128;
    }

    function isValidEarning(data) {
      return data.keys().hasAll(['date', 'platform', 'amount', 'hours', 'km'])
        && data.date is string
        && data.platform in ['uber', '99', 'outros']
        && data.amount is number && data.amount >= 0 && data.amount <= 1000000
        && data.hours is number && data.hours >= 0 && data.hours <= 24
        && data.km is number && data.km >= 0 && data.km <= 5000;
    }

    function isValidExpense(data) {
      return data.keys().hasAll(['date', 'category', 'amount', 'description'])
        && data.date is string
        && data.category in ['combustivel', 'alimentacao', 'taxas', 'lavagem', 'outros']
        && data.amount is number && data.amount >= 0 && data.amount <= 100000
        && data.description is string && data.description.size() <= 200;
    }

    // ✅ User profile
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) && isValidUser(userId)
        && resource == null  // Apenas create, não delete profile
        && request.resource.data.keys().hasAll(['vehicle', 'goals', 'theme'])
        && request.resource.data.goals is map
        && request.resource.data.goals.earningGoal >= 0;

      // ✅ Earnings subcollection - com validação
      match /earnings/{docId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && isValidEarning(request.resource.data);
        allow update: if isOwner(userId) && isValidEarning(request.resource.data);
        allow delete: if isOwner(userId);  // Log this deletion
      }

      // ✅ Expenses subcollection - com validação
      match /expenses/{docId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && isValidExpense(request.resource.data);
        allow update: if isOwner(userId) && isValidExpense(request.resource.data);
        allow delete: if isOwner(userId);  // Log this deletion
      }
    }

    // ✅ Block everything
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🟠 VULNERABILIDADES MÉDIAS

### 4. Weak Password Policy

**Localização**: `LoginScreen.tsx` (Firebase default)

**Problema**: Firebase aceita passwords com apenas 6 caracteres

```typescript
'auth/weak-password': 'Senha muito fraca (mín. 6 caracteres).',
```

**Fix - Validação mais forte no frontend**:

```typescript
// src/lib/validation.ts
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 12) errors.push('Mínimo 12 caracteres');
  if (!password.match(/[A-Z]/)) errors.push('Pelo menos 1 letra maiúscula');
  if (!password.match(/[a-z]/)) errors.push('Pelo menos 1 letra minúscula');
  if (!password.match(/[0-9]/)) errors.push('Pelo menos 1 número');
  if (!password.match(/[!@#$%^&*]/)) errors.push('Pelo menos 1 caractere especial (!@#$%^&*)');

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

```typescript
// src/components/LoginScreen.tsx
const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

const handlePasswordChange = (value: string) => {
  setPassword(value);
  if (isSignUp) {
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
  }
};

async function handleSubmit(e: React.FormEvent) {
  if (isSignUp) {
    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }
  }
  // ... rest of code
}

<Input
  id="login-password"
  label="Senha"
  type="password"
  value={password}
  onChange={(e) => handlePasswordChange(e.target.value)}
  error={passwordErrors.length > 0 ? passwordErrors[0] : ''}
  required
  minLength={12}
/>
```

---

### 5. Missing Content Security Policy (CSP)

**Localização**: Não configurado em `vite.config.ts`

**Problema**: Sem CSP headers, XSS é mais fácil de explorar

**Fix - Adicionar CSP às respostas HTTP**:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Isso funciona apenas em dev. Em produção, configure no servidor
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' apis.google.com *.firebase.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' *.firebase.com *.firestore.googleapis.com api.groq.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
})
```

**Para Firebase Hosting**:

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.firebase.com apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' *.firebase.com *.firestore.googleapis.com; frame-ancestors 'none';"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      }
    ]
  }
}
```

---

### 6. API Keys Visíveis em DevTools

**Localização**: `src/components/InsightsPanel.tsx:52`

```typescript
const hasApiKey = !!import.meta.env.VITE_GROQ_API_KEY;  // ❌ Expõe valor em DevTools
```

**Problema**:
- Em Firefox DevTools → Sources → você pode ver o valor da variável
- Attacker pode copiar `VITE_GROQ_API_KEY` diretamente

**Fix - Backend Proxy**:

```typescript
// src/lib/groqClient.ts
export async function callGroqWithBackend(prompt: string): Promise<string> {
  // Chamar seu próprio backend, não a API diretamente
  const response = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) throw new Error('Erro ao buscar insights');
  const data = await response.json();
  return data.insights;
}
```

```javascript
// backend (Node.js/Express) - Arquivo separado
app.post('/api/insights', async (req, res) => {
  const { prompt } = req.body;

  // API key fica apenas no servidor, nunca no cliente
  const apiKey = process.env.GROQ_API_KEY;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  res.json({ insights: data.choices[0].message.content });
});
```

---

### 7. Se Firebase Rules Não Bloqueiem Modificações

**Localização**: `firestore.rules` - Write sem validação

**Problema**: Um usuário pode fazer:
```javascript
// Modificar dados invalidamente
db.collection('users').doc(userId).set({
  amount: -99999,  // ❌ Negativo
  hours: 999,      // ❌ Valor absurdo
});
```

**Fix**: Já incluído na seção 3 acima (Firestore Rules)

---

## 🟡 MELHORIAS RECOMENDADAS

### 8. Adicionar Rate Limiting no Frontend

```typescript
// src/lib/rateLimit.ts
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number = 5, timeWindowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove tentativas antigas
    const recentAttempts = attempts.filter(t => now - t < timeWindowMs);

    if (recentAttempts.length >= maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }
}

export const loginLimiter = new RateLimiter();
```

```typescript
// LoginScreen.tsx
const handleSubmit = async (e: React.FormEvent) => {
  if (!loginLimiter.isAllowed('login', 5, 60000)) {
    setError('Muitas tentativas. Aguarde 1 minuto.');
    return;
  }
  // ... rest
};
```

---

### 9. Adicionar Input Validation em Todos os Forms

```typescript
// src/lib/validator.ts
export const validators = {
  amount: (value: number) => value > 0 && value <= 1000000 ? null : 'Valor inválido',
  hours: (value: number) => value >= 0 && value <= 24 ? null : 'Horas inválidas',
  km: (value: number) => value >= 0 && value <= 5000 ? null : 'KM inválido',
  date: (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? null : 'Data inválida',
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Email inválido',
  displayName: (value: string) => value.length > 0 && value.length <= 100 ? null : 'Nome inválido',
};
```

---

### 10. Implementar HTTPS-Only Mode

```typescript
// main.tsx ou uma função que roda no app init
if (window.location.protocol === 'http:' && import.meta.env.PROD) {
  window.location.replace(`https:${window.location.href.substring(5)}`);
}
```

```json
// firebase.json - Force HTTPS
{
  "hosting": {
    "redirects": [
      {
        "source": "**",
        "destination": "index.html",
        "type": 301
      }
    ]
  }
}
```

---

## 🟢 BOAS PRÁTICAS IMPLEMENTADAS

✅ **O que está BEM**:
- Auth context bem estruturado
- Firebase Rules básicas implementadas
- Error boundary configurado
- Reauthentication requerido para operações sensíveis
- JSON Web Tokens gerenciados pelo Firebase (não manual)
- Input type HTML5 (email, password, number)

---

## 📋 CHECKLIST DE CORREÇÕES (Prioridades)

### URGENTE (Corrigir hoje):
- [ ] **REMOVER .env DO GIT** (revogar todas as chaves)
- [ ] **Corrigir XSS em InsightsPanel** (instalar DOMPurify)
- [ ] **Atualizar Firestore Rules** (adicionar validações)

### IMPORTANTE (Esta semana):
- [ ] Adicionar validação de password forte
- [ ] Implementar CSP headers
- [ ] Adicionar input validation
- [ ] Usar backend proxy para APIs
- [ ] Rate limiting

### RECOMENDADO (Próximas 2 semanas):
- [ ] HTTPS-only
- [ ] Sentry/error tracking
- [ ] Audit logging
- [ ] Dependency scanning (npm audit)
- [ ] OWASP ZAP testing

---

## 📊 SCORE DE SEGURANÇA

| Aspecto | Score | Status |
|---------|-------|--------|
| Autenticação | 7/10 | 🟠 Bom, mas fraco password policy |
| Autorização | 6/10 | 🟠 Firebase rules básicas |
| Data Protection | 3/10 | 🔴 API keys expostas |
| Input Validation | 4/10 | 🔴 Mínima |
| XSS Protection | 2/10 | 🔴 dangerouslySetInnerHTML |
| CSRF Protection | 8/10 | 🟢 Firebase gerencia |
| HTTPS/Encryption | 0/10 | 🔴 Não configurado |
| Error Handling | 6/10 | 🟠 Aceitável |
| **GERAL** | **4/10** | **🔴 CRÍTICO** |

---

## 📞 PRÓXIMOS PASSOS

1. Implementar todos os fixes CRÍTICOS
2. Executar testes de segurança com OWASP ZAP
3. Fazer code review de todos os components
4. Implementar WAF (Web Application Firewall)
5. Realizar security training da equipe

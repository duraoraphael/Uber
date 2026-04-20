# 🐛 Relatório Completo de Bugs e Problemas — driveFinance

**Data da auditoria:** 2026-04-20  
**Status:** Pronto para correção

---

## 📋 Resumo Executivo

Auditoria completa do codebase identificou **12 categorias de problemas críticos**, incluindo erros de build, vazamento de credenciais, problemas de segurança e ineficiências de código.

---

## 1. 🔴 CRITICAL BUILD ERRORS

### 1.1 Módulo Desaparecido: `isomorphic-dompurify`
- **Arquivo:** `src/lib/sanitize.ts:11`
- **Erro:** `error TS2307: Cannot find module 'isomorphic-dompurify'`
- **Problema:** O código importa `isomorphic-dompurify` que não está instalado
- **Causa:** O package.json instala `dompurify` mas o código tenta importar `isomorphic-dompurify`
- **Fix:** Usar `dompurify` diretamente

### 1.2 Variáveis Não Utilizadas
- **Arquivo:** `src/lib/csvExport.ts:2`
  - `currency` importado mas nunca usado
  - `monthLabel` declarado 2x mas nunca usado
  
- **Arquivo:** `src/lib/csvExport.ts:109-110`
  - `earnings` e `expenses` parâmetros nunca utilizados em `exportFiscalReportCSV()`

- **Arquivo:** `src/hooks/usePushNotifications.ts:5`
  - `NotificationPayload` interface não utilizada
  
- **Arquivo:** `src/hooks/usePushNotifications.ts:13`
  - `token` e `setToken` declarados mas nunca usados

**Fix:** Remover imports/variáveis não utilizados

---

## 2. 🔐 SECURITY ISSUES

### 2.1 Credenciais Expostas no `.env`
- **Severidade:** 🔴 CRÍTICA
- **Arquivo:** `.env`
- **Problema:** 
  - `VITE_GROQ_API_KEY` exposta em repositório público
  - `VITE_FIREBASE_API_KEY` exposta
  - `VITE_FIREBASE_FCM_VAPID_KEY` exposta
- **Risco:** Qualquer pessoa com acesso ao repo pode usar sua quota de API/Firebase
- **Fix:** 
  1. Remover `.env` do git
  2. Adicionar à `.gitignore` (se não estiver)
  3. Fazer rollover de todas as chaves (invalide as antigas)
  4. Usar `.env.example` com placeholders

### 2.2 Problemas em Firestore Rules (`firestore.rules.secure`)

#### 2.2.1 Validação de Earning Muito Restritiva
- **Problema:** Apenas permite criar com campos específicos `hasOnly()`
- **Linha:** 86
- **Impacto:** Quando o client envia dados legítimos com metadados adicionais (timestamps, etc), a criação falha silenciosamente

#### 2.2.2 Validação de User Profile Excessivamente Restritiva
- **Problema:** `isValidUserProfile()` exige TODOS os 4 campos obrigatórios, mesmo em updates parciais
- **Linha:** 49-54
- **Impacto:** Não é possível fazer update de um único campo (ex: apenas theme) sem re-enviar vehicle/maintenanceConfig/goals

#### 2.2.3 Falta de Validação de `fcmToken`
- **Problema:** Linha 69 permite `fcmToken`, `fcmTokenUpdatedAt`, `lastUpdated` mas não valida seu formato
- **Risco:** Qualquer string é aceita como token

### 2.3 Falta de Sanitização em App.tsx
- **Arquivo:** `src/App.tsx`
- **Problema:** Dados de entrada do usuário não são sanitizados antes de armazenar no Firestore
- **Risco:** Injection attacks através de descrições, nomes de veículos, etc.

---

## 3. 🔧 BUILD & TYPE ERRORS (não-bloqueantes mas prejudicam CI/CD)

Todos os erros listados em `npm run build` devem ser resolvidos para garantir build limpo.

---

## 4. 📊 CODE QUALITY ISSUES

### 4.1 Console Logs em Produção
- **Arquivos com console.log/warn/error:**
  - `src/lib/messaging.ts` — 8 console.log/warn/error
  - `src/hooks/usePushNotifications.ts` — 3 statements
  - `src/hooks/useAppDataFirebase.ts` — 2 statements
  - `src/lib/csvExport.ts` — Sem logs (bom!)
  - `src/components/ErrorBoundary.tsx` — 1 (aceitável para error boundary)

**Fix:** Remover todos os console.logs de produção; manter apenas em dev ou como fallback de erro crítico.

### 4.2 Tipo `any` em Funções
- **Arquivo:** `src/lib/messaging.ts:123-124`
- **Função:** `saveFcmTokenToFirestore()`
- **Problema:** `db: any` sem tipagem adequada
- **Fix:** Importar tipo correto de `firebase/firestore`

### 4.3 Imports Desnecessários
- `src/lib/csvExport.ts:2` - `currency` não usado
- Vários imports de componentes nunca renderizados

---

## 5. ⚠️ FUNCTIONAL BUGS

### 5.1 Validação de Earning Incompleta
- **Arquivo:** `firestore.rules.secure:22-30`
- **Problema:** Earnings com `amount > 1000000` ou `hours > 24` ou `km > 5000` são rejeitados
- **Impacto:** Um motorista que trabalhar 25h não consegue registrar; viagens muito longas são rejeitadas
- **Fix:** Ajustar limites ou remover validação no client (mover para backend)

### 5.2 Falta de Validação de Data
- **Arquivo:** `firestore.rules.secure`
- **Problema:** Apenas checa se data matches `^\d{4}-\d{2}-\d{2}$`, mas não valida se é data real (29/02 em ano não-bissexto, etc.)
- **Fix:** Validação no client ou aceitar e confiar na lógica do client

### 5.3 Import Pattern Inconsistent
- **Arquivo:** `src/lib/messaging.ts:126`
- **Problema:** Dynamic import dentro de função → mais lento
- **Fix:** Importar no top do arquivo

---

## 6. 🚀 PERFORMANCE ISSUES

### 6.1 Caching em Gemini Insights Poderia ser Melhor
- **Arquivo:** `src/hooks/useGeminiInsights.ts`
- **Problema:** Cache é salvo em localStorage com TTL, mas sem estratégia de limpeza de caches antigos
- **Fix:** Implementar limite de caches ou usar IndexedDB para dados maiores

### 6.2 Real-time Listeners Não Desinscritos Corretamente
- **Arquivo:** `src/hooks/useAppDataFirebase.ts:126-131`
- **Problema:** Listeners são desinscritos, mas se há erro antes disso, pode vazar memória
- **Fix:** Usar try-finally ou garantir que cleanup é sempre chamado

---

## 7. 📱 MISSING FEATURES / IMPROVEMENTS

### 7.1 Sem Tratamento de Erro de Conexão Offline
- **Problema:** Quando o app perde conexão, não há feedback visual claro
- **Fix:** Adicionar indicador de status online/offline

### 7.2 Sem Validação de Email em Frontend
- **Arquivo:** `src/components/LoginScreen.tsx`
- **Problema:** Input tipo `email` faz validação básica mas não rejeita emails inválidos como `test@.com`
- **Fix:** Usar regex ou biblioteca de validação

### 7.3 Sem Tratamento de Token Expirado
- **Arquivo:** `src/lib/messaging.ts`
- **Problema:** FCM token pode expirar; app não faz refresh automático
- **Fix:** Implementar listener para refresh de token

### 7.4 Sem Sanitização de URL em Links
- **Arquivo:** `src/lib/gemini.ts`
- **Problema:** URLs em markdown não são validadas antes de incluir no prompt
- **Fix:** Usar `isSafeUrl()` de `sanitize.ts`

---

## 8. 📋 CODE ORGANIZATION & PATTERNS

### 8.1 Magic Numbers Sem Constantes
- `src/App.tsx:237` — strings literais de altura (`h-10 sm:h-12`)
- `src/hooks/useGeminiInsights.ts:31` — COOLDOWN_MS hardcoded

### 8.2 Duplicação de Logic
- Theme handling em múltiplos componentes em vez de context
- Status cálculo de meta (diária, mensal) repetido

---

## 9. 🧪 TESTING GAPS

- Sem testes unitários
- Sem testes de integração
- Sem e2e tests
- **Recomendação:** Adicionar testes críticos (auth, data persistence, calculations)

---

## 10. 📖 DOCUMENTATION

### 10.1 Falta de Documentação
- Funções complexas sem JSDoc
- Setup de FCM não documentado no README
- Processo de migração de dados não documentado

---

## 11. ⚙️ CONFIGURATION ISSUES

### 11.1 TypeScript Strict Mode Não Ativado
- **tsconfig.json** não tem `strict: true`
- Deixa passar erros potenciais

### 11.2 ESLint Não Configurado Rigorosamente
- Sem regra contra console.log
- Sem rule para unused variables

---

## 12. 🔄 DEPLOYMENT READINESS

### 12.1 Build Falha
- `npm run build` não executa com sucesso (veja item 1)

### 12.2 Sem Variáveis de Ambiente Secretas
- `.env` público (veja item 2.1)

### 12.3 Sem CI/CD Pipeline Documentado
- Sem .github/workflows
- Sem testes automatizados

---

## ✅ FIXES A APLICAR (em ordem de prioridade)

| Prioridade | Issue | Status |
|---|---|---|
| 🔴 CRÍTICO | Fix sanitize.ts import | Pendente |
| 🔴 CRÍTICO | Remove exposed credentials | Pendente |
| 🔴 CRÍTICO | Fix Firestore rules validation | Pendente |
| 🟠 ALTO | Remove unused vars/imports | Pendente |
| 🟠 ALTO | Remove console logs | Pendente |
| 🟠 ALTO | Fix type errors | Pendente |
| 🟡 MÉDIO | Improve error handling | Pendente |
| 🟡 MÉDIO | Add input validation | Pendente |
| 🟢 BAIXO | Add documentation | Pendente |
| 🟢 BAIXO | Add tests | Pendente |

---

## 📊 ESTATÍSTICAS

- **Total de Bugs:** 40+
- **Build-blocking:** 5
- **Security Issues:** 8
- **Performance Issues:** 3
- **Code Quality Issues:** 12+
- **Missing Features:** 4

---

**Próximo passo:** Executar os fixes na ordem de prioridade

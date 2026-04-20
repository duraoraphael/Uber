// ============================================================
// Chat contextual com IA — Groq / Llama 3.3 70B
// ============================================================

import type { MonthlySummary, GoalConfig, Earning, Expense } from '../types';
import { currency } from './utils';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildChatSystemPrompt(
  summary: MonthlySummary,
  goals: GoalConfig,
  earnings: Earning[],
  expenses: Expense[],
): string {
  const todayISO = new Date().toISOString().slice(0, 10);
  const earningsToday = earnings
    .filter((e) => e.date === todayISO)
    .reduce((s, e) => s + e.amount, 0);

  const remainingGoal = Math.max(0, goals.earningGoal - summary.totalEarnings);

  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = lastDay - now.getDate() + 1;
  const adaptiveGoal = remainingDays > 0 ? remainingGoal / remainingDays : 0;

  return `Você é o Assistente Financeiro do driveFinance, especializado em motoristas de aplicativo no Brasil.

## Situação financeira atual do motorista (mês ${summary.month})

- Ganho bruto: ${currency(summary.totalEarnings)}
- Total de gastos: ${currency(summary.totalExpenses)}
- Lucro líquido: ${currency(summary.netProfit)}
- Horas trabalhadas: ${summary.totalHours}h
- KM rodados: ${summary.totalKm} km
- R$/hora: ${currency(summary.earningsPerHour)}
- R$/km: ${currency(summary.earningsPerKm)}
- Ganhos hoje: ${currency(earningsToday)}

## Metas
- Meta mensal: ${currency(goals.earningGoal)}
- Limite de gastos: ${currency(goals.expenseLimit)}
- Faltam: ${currency(remainingGoal)} em ${remainingDays} dias
- Meta diária adaptativa: ${currency(adaptiveGoal)}/dia

## Regras de resposta
- Responda SEMPRE em português brasileiro
- Seja direto, prático e específico com os valores do motorista
- Use os dados acima para responder perguntas sobre metas, ganhos e eficiência
- Máximo 150 palavras por resposta
- Sem markdown excessivo — respostas conversacionais e claras`;
}

export async function sendChatMessage(
  history: ChatMessage[],
  userMessage: string,
  summary: MonthlySummary,
  goals: GoalConfig,
  earnings: Earning[],
  expenses: Expense[],
  signal?: AbortSignal,
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Chave da API não configurada.');
  }

  const systemPrompt = buildChatSystemPrompt(summary, goals, earnings, expenses);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 512,
    }),
    signal,
  });

  if (!res.ok) {
    let detail = `Status ${res.status}`;
    try {
      const body = await res.json() as { error?: { message?: string } };
      detail = body?.error?.message ?? detail;
    } catch { /* ignore */ }
    throw new Error(`Erro Groq: ${detail}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Resposta vazia da IA.');
  return content;
}

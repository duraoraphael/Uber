// ============================================================
// Serviço de IA — chamada à API Groq (Llama 3.3 70B)
// ============================================================

import type { MonthlySummary, Earning, Expense, Vehicle } from '../types';
import { currency } from './utils';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Você é um **Consultor Financeiro** especializado em motoristas de aplicativo (Uber/99) que atuam em **Macaé/RJ**.

Seu papel é analisar os dados financeiros que o motorista fornecer e responder com uma análise concisa, prática e acionável.

Contexto fixo do motorista:
- Veículo: Fiat Argo 2020 (Flex)
- Cidade: Macaé/RJ (preço médio da gasolina na região ~R$ 6,00/L)
- Consumo médio urbano do Fiat Argo: ~12 km/l (gasolina) ou ~8 km/l (etanol)

Você DEVE analisar:
1. **Lucro real por KM** → (Ganhos − Gastos) / KM Rodados. Diga se está bom ou ruim e compare com benchmarks.
2. **Eficiência de combustível** → Com base no valor gasto e nos KM rodados, calcule o consumo real (km/l). Compare com a média esperada do Argo.
3. **Sugestões de metas** → Baseado no histórico, sugira metas diárias ou semanais realistas para os próximos dias.
4. **Alertas** → Gastos fora do padrão, tendências negativas, oportunidades de economia.

Regras de formatação:
- Responda em **Markdown** limpo (use ##, ###, listas, **negrito**).
- Use emojis com moderação para dar destaque visual (⚠️ 💡 ✅ 📊 🚗 ⛽).
- Seja direto — no máximo 400 palavras.
- Valores monetários sempre em R$ com 2 casas decimais.
- Se não houver dados suficientes, diga claramente e sugira o que o motorista deve registrar.`;

function buildUserPrompt(
  summary: MonthlySummary,
  prevSummary: MonthlySummary | null,
  earnings: Earning[],
  expenses: Expense[],
  vehicle: Vehicle | null,
): string {
  const monthEarnings = earnings.filter((e) => e.date.startsWith(summary.month));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(summary.month));

  let prompt = `## Dados do mês ${summary.month}\n\n`;

  // Resumo geral
  prompt += `**Ganho Bruto:** ${currency(summary.totalEarnings)}\n`;
  prompt += `**Total Gastos:** ${currency(summary.totalExpenses)}\n`;
  prompt += `**Lucro Líquido:** ${currency(summary.netProfit)}\n`;
  prompt += `**Horas Trabalhadas:** ${summary.totalHours}h\n`;
  prompt += `**KM Rodados:** ${summary.totalKm} km\n`;
  prompt += `**R$/Hora:** ${currency(summary.earningsPerHour)}\n`;
  prompt += `**R$/KM:** ${currency(summary.earningsPerKm)}\n\n`;

  // Por plataforma
  prompt += `### Ganhos por plataforma\n`;
  prompt += `- Uber: ${currency(summary.earningsByPlatform.uber)}\n`;
  prompt += `- 99: ${currency(summary.earningsByPlatform['99'])}\n`;
  prompt += `- Outros: ${currency(summary.earningsByPlatform.outros)}\n\n`;

  // Gastos por categoria
  prompt += `### Gastos por categoria\n`;
  prompt += `- Combustível: ${currency(summary.expensesByCategory.combustivel)}\n`;
  prompt += `- Alimentação: ${currency(summary.expensesByCategory.alimentacao)}\n`;
  prompt += `- Taxas/Impostos: ${currency(summary.expensesByCategory.taxas)}\n`;
  prompt += `- Lavagem: ${currency(summary.expensesByCategory.lavagem)}\n`;
  prompt += `- Outros: ${currency(summary.expensesByCategory.outros)}\n\n`;

  // Detalhes combustível
  const fuelExpenses = monthExpenses.filter((e) => e.category === 'combustivel');
  if (fuelExpenses.length > 0) {
    prompt += `### Abastecimentos (${fuelExpenses.length} registros)\n`;
    for (const f of fuelExpenses) {
      prompt += `- ${f.date}: ${currency(f.amount)}`;
      if (f.pricePerLiter) prompt += ` (R$ ${f.pricePerLiter.toFixed(2)}/L`;
      if (f.liters) prompt += `, ${f.liters.toFixed(1)}L`;
      if (f.pricePerLiter) prompt += `)`;
      prompt += `${f.description ? ` — ${f.description}` : ''}\n`;
    }
    prompt += '\n';
  }

  // Mês anterior
  if (prevSummary && prevSummary.totalEarnings > 0) {
    prompt += `### Comparação mês anterior (${prevSummary.month})\n`;
    prompt += `- Ganhos: ${currency(prevSummary.totalEarnings)} → ${currency(summary.totalEarnings)}\n`;
    prompt += `- Gastos: ${currency(prevSummary.totalExpenses)} → ${currency(summary.totalExpenses)}\n`;
    prompt += `- Lucro: ${currency(prevSummary.netProfit)} → ${currency(summary.netProfit)}\n`;
    prompt += `- KM: ${prevSummary.totalKm} → ${summary.totalKm}\n\n`;
  }

  // Veículo
  if (vehicle) {
    prompt += `### Veículo cadastrado\n`;
    prompt += `${vehicle.model} ${vehicle.year} • ${vehicle.fuelType}`;
    if (vehicle.avgKmPerLiter) prompt += ` • ${vehicle.avgKmPerLiter} km/l`;
    prompt += `\n\n`;
  }

  // Últimos ganhos para contexto de padrão diário
  const recentEarnings = monthEarnings.slice(-10);
  if (recentEarnings.length > 0) {
    prompt += `### Últimos ${recentEarnings.length} ganhos\n`;
    for (const e of recentEarnings) {
      prompt += `- ${e.date}: ${currency(e.amount)} (${e.platform}, ${e.hours}h, ${e.km}km)\n`;
    }
    prompt += '\n';
  }

  prompt += `Analise em detalhes e forneça seus insights, sugestões de metas e alertas.`;
  return prompt;
}

export async function generateGeminiInsight(
  summary: MonthlySummary,
  prevSummary: MonthlySummary | null,
  earnings: Earning[],
  expenses: Expense[],
  vehicle: Vehicle | null,
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY não configurada. Adicione no arquivo .env');
  }

  const userPrompt = buildUserPrompt(summary, prevSummary, earnings, expenses, vehicle);

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Erro Groq (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

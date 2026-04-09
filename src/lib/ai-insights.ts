// ============================================================
// Motor de Insights de IA (simulado)
//
// Em produção, substitua generateInsights() por uma chamada real
// à API da OpenAI ou Gemini, enviando o MonthlySummary como contexto.
// ============================================================

import type { MonthlySummary, AIInsight } from '../types';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Gera insights simulados analisando os dados do mês.
 * Cada "regra" verifica uma condição e produz um conselho relevante.
 */
export function generateInsights(
  current: MonthlySummary,
  previous: MonthlySummary | null,
): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date().toISOString();

  // --- Regra 1: Gasto com combustível muito alto ---
  if (current.totalEarnings > 0) {
    const fuelRatio = current.expensesByCategory.combustivel / current.totalEarnings;
    if (fuelRatio > 0.25) {
      insights.push({
        id: uid(),
        type: 'warning',
        message: `Seu gasto com combustível representa ${(fuelRatio * 100).toFixed(0)}% do faturamento bruto. Considere verificar a manutenção do veículo ou otimizar rotas.`,
        createdAt: now,
      });
    }
  }

  // --- Regra 2: Comparação com mês anterior (combustível) ---
  if (previous && previous.expensesByCategory.combustivel > 0) {
    const diff =
      ((current.expensesByCategory.combustivel - previous.expensesByCategory.combustivel) /
        previous.expensesByCategory.combustivel) *
      100;
    if (diff > 10) {
      insights.push({
        id: uid(),
        type: 'warning',
        message: `Seu gasto com combustível subiu ${diff.toFixed(0)}% em relação ao mês anterior. Verifique a calibragem dos pneus e o filtro de ar.`,
        createdAt: now,
      });
    }
  }

  // --- Regra 3: Plataforma mais rentável ---
  const platforms = current.earningsByPlatform;
  const bestPlatform = (Object.entries(platforms) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0];
  if (bestPlatform && bestPlatform[1] > 0) {
    insights.push({
      id: uid(),
      type: 'tip',
      message: `Sua maior receita veio da plataforma "${bestPlatform[0].toUpperCase()}" (R$ ${bestPlatform[1].toFixed(2)}). Considere priorizar horários de pico nesta plataforma.`,
      createdAt: now,
    });
  }

  // --- Regra 4: Ganho por hora baixo ---
  if (current.earningsPerHour > 0 && current.earningsPerHour < 20) {
    insights.push({
      id: uid(),
      type: 'warning',
      message: `Sua média de ganho por hora está em R$ ${current.earningsPerHour.toFixed(2)}. Tente focar em horários de alta demanda (manhã 7-9h e noite 18-21h).`,
      createdAt: now,
    });
  }

  // --- Regra 5: Lucro positivo ---
  if (current.netProfit > 0) {
    insights.push({
      id: uid(),
      type: 'positive',
      message: `Parabéns! Seu lucro líquido real este mês é de R$ ${current.netProfit.toFixed(2)} após todos os descontos e reserva de manutenção.`,
      createdAt: now,
    });
  }

  // --- Regra 6: Lucro negativo ---
  if (current.netProfit < 0) {
    insights.push({
      id: uid(),
      type: 'warning',
      message: `Atenção: você está operando no prejuízo (R$ ${current.netProfit.toFixed(2)}). Revise seus gastos e considere aumentar as horas em horários rentáveis.`,
      createdAt: now,
    });
  }

  // --- Regra 7: Sem registros ---
  if (current.totalEarnings === 0 && current.totalExpenses === 0) {
    insights.push({
      id: uid(),
      type: 'tip',
      message: 'Nenhum dado registrado este mês. Comece adicionando seus ganhos e gastos para receber análises personalizadas!',
      createdAt: now,
    });
  }

  return insights;
}

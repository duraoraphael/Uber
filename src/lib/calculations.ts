// ============================================================
// Funções de cálculo financeiro e manutenção
// ============================================================

import type {
  Earning,
  Expense,
  MaintenanceReserveConfig,
  MonthlySummary,
  Platform,
  ExpenseCategory,
} from '../types';

/** Retorna a string YYYY-MM de uma data ISO */
export function getMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Gera o mês corrente no formato YYYY-MM */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calcula o valor da reserva de manutenção com base na config.
 *
 * PREVENTIVA: cobre itens previsíveis (óleo, filtros, pneus, correias).
 *   - Troca de óleo: ~R$ 200 a cada 5.000 km → R$ 0,04/km
 *   - Pneus: ~R$ 1.200 a cada 40.000 km → R$ 0,03/km
 *   - Revisão geral: ~R$ 800 a cada 10.000 km → R$ 0,08/km
 *   Subtotal preventivo: ~R$ 0,15/km (arredondado para baixo)
 *
 * CORRETIVA: cobre imprevistos (freios, suspensão, embreagem).
 *   - Estimativa conservadora: ~3% a 5% do faturamento bruto.
 *
 * O método 'per_km' aplica o custo/km sobre o total de km rodados.
 * O método 'per_revenue' aplica um % sobre o bruto → cobre ambos.
 */
export function calculateMaintenanceReserve(
  config: MaintenanceReserveConfig,
  totalKm: number,
  totalEarnings: number,
): number {
  if (config.method === 'per_km') {
    return totalKm * config.valuePerKm;
  }
  return totalEarnings * (config.revenuePercent / 100);
}

/** Calcula o resumo mensal a partir dos registros filtrados */
export function computeMonthlySummary(
  earnings: Earning[],
  expenses: Expense[],
  config: MaintenanceReserveConfig,
  month: string,
): MonthlySummary {
  const monthEarnings = earnings.filter((e) => getMonth(e.date) === month);
  const monthExpenses = expenses.filter((e) => getMonth(e.date) === month);

  const earningsByPlatform: Record<Platform, number> = { uber: 0, '99': 0, outros: 0 };
  let totalEarnings = 0;
  let totalHours = 0;
  let totalKm = 0;

  for (const e of monthEarnings) {
    totalEarnings += e.amount;
    totalHours += e.hours;
    totalKm += e.km;
    earningsByPlatform[e.platform] += e.amount;
  }

  const expensesByCategory: Record<ExpenseCategory, number> = {
    combustivel: 0, alimentacao: 0, taxas: 0, lavagem: 0, outros: 0,
  };
  let totalExpenses = 0;

  for (const e of monthExpenses) {
    totalExpenses += e.amount;
    expensesByCategory[e.category] += e.amount;
  }

  const maintenanceReserve = calculateMaintenanceReserve(config, totalKm, totalEarnings);
  const netProfit = totalEarnings - totalExpenses - maintenanceReserve;

  return {
    month,
    totalEarnings,
    earningsByPlatform,
    totalExpenses,
    expensesByCategory,
    maintenanceReserve,
    netProfit,
    totalHours,
    totalKm,
    earningsPerHour: totalHours > 0 ? totalEarnings / totalHours : 0,
    earningsPerKm: totalKm > 0 ? totalEarnings / totalKm : 0,
  };
}

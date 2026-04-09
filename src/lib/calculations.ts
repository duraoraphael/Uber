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

/** Retorna o mês anterior no formato YYYY-MM */
export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Gera lista dos últimos N meses a partir de um mês base */
export function getLastNMonths(baseMonth: string, n: number): string[] {
  const months: string[] = [];
  let current = baseMonth;
  for (let i = 0; i < n; i++) {
    months.unshift(current);
    current = previousMonth(current);
  }
  return months;
}

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

/** Resumo semanal de um mês */
export interface WeeklySummary {
  week: number;
  label: string;
  earnings: number;
  expenses: number;
  profit: number;
  hours: number;
  km: number;
}

export function computeWeeklySummaries(
  earnings: Earning[],
  expenses: Expense[],
  month: string,
): WeeklySummary[] {
  const [y, m] = month.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);

  const weeks: WeeklySummary[] = [];
  let weekStart = new Date(firstDay);
  let weekNum = 1;

  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());

    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);

    const wEarnings = earnings.filter((e) => e.date >= startStr && e.date <= endStr);
    const wExpenses = expenses.filter((e) => e.date >= startStr && e.date <= endStr);

    const totalEarnings = wEarnings.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = wExpenses.reduce((s, e) => s + e.amount, 0);

    weeks.push({
      week: weekNum,
      label: `${startStr.slice(8)}-${endStr.slice(8)}/${String(m).padStart(2, '0')}`,
      earnings: totalEarnings,
      expenses: totalExpenses,
      profit: totalEarnings - totalExpenses,
      hours: wEarnings.reduce((s, e) => s + e.hours, 0),
      km: wEarnings.reduce((s, e) => s + e.km, 0),
    });

    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
    weekNum++;
  }

  return weeks;
}

/** Calcula o custo estimado de combustível baseado em km e consumo */
export function estimateFuelCost(
  totalKm: number,
  avgKmPerLiter: number,
  pricePerLiter: number,
): number {
  if (avgKmPerLiter <= 0) return 0;
  return (totalKm / avgKmPerLiter) * pricePerLiter;
}

/** Calcula variação percentual */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

/** Resumo mensal de combustível */
export interface FuelMonthlySummary {
  totalFuelExpense: number;
  totalLiters: number;
  totalKm: number;
  avgPricePerLiter: number;
  costPerKm: number;
}

/**
 * Filtra registros do mês e retorna gasto total com combustível e KM total.
 * Usa `reduce` conforme requisito.
 */
export function computeFuelMonthlySummary(
  earnings: Earning[],
  expenses: Expense[],
  month: string,
): FuelMonthlySummary {
  const fuelSummary = expenses
    .filter((e) => getMonth(e.date) === month && e.category === 'combustivel')
    .reduce(
      (acc, e) => ({
        totalFuelExpense: acc.totalFuelExpense + e.amount,
        totalLiters: acc.totalLiters + (e.liters ?? 0),
        count: acc.count + (e.pricePerLiter ? 1 : 0),
        sumPrice: acc.sumPrice + (e.pricePerLiter ?? 0),
      }),
      { totalFuelExpense: 0, totalLiters: 0, count: 0, sumPrice: 0 },
    );

  const totalKm = earnings
    .filter((e) => getMonth(e.date) === month)
    .reduce((acc, e) => acc + e.km, 0);

  const avgPricePerLiter = fuelSummary.count > 0 ? fuelSummary.sumPrice / fuelSummary.count : 0;
  const costPerKm = totalKm > 0 ? fuelSummary.totalFuelExpense / totalKm : 0;

  return {
    totalFuelExpense: fuelSummary.totalFuelExpense,
    totalLiters: fuelSummary.totalLiters,
    totalKm,
    avgPricePerLiter,
    costPerKm,
  };
}

import type { Earning, Expense, MonthlySummary } from '../types';
import { currency, formatCurrency } from './utils';
import { getMonth } from './calculations';

const CATEGORY_LABELS: Record<string, string> = {
  combustivel: 'Combustível',
  alimentacao: 'Alimentação',
  taxas: 'Taxas/Impostos',
  lavagem: 'Lavagem',
  outros: 'Outros',
};

const PLATFORM_LABELS: Record<string, string> = {
  uber: 'Uber',
  '99': '99',
  outros: 'Outros',
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatMonth(monthStr: string): string {
  const [y, mo] = monthStr.split('-');
  const names = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${names[parseInt(mo, 10) - 1]} de ${y}`;
}

function escapeCSV(value: string | number | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(filename: string, csvContent: string) {
  // BOM para UTF-8 com Excel (garante que acentos funcionem)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Exporta ganhos como CSV (Excel-compatible) */
export function exportEarningsCSV(earnings: Earning[], month?: string): boolean {
  const filtered = month ? earnings.filter((e) => getMonth(e.date) === month) : earnings;
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return false;

  const totalAmount = sorted.reduce((s, e) => s + e.amount, 0);
  const totalHours = sorted.reduce((s, e) => s + e.hours, 0);
  const totalKm = sorted.reduce((s, e) => s + e.km, 0);
  const monthLabel = month ? formatMonth(month) : 'Todos os meses';

  let csv = 'Data,Plataforma,Valor,Horas,Quilômetros\n';

  for (const e of sorted) {
    csv += `${formatDate(e.date)},${PLATFORM_LABELS[e.platform] || e.platform},${e.amount.toFixed(2)},${e.hours},${e.km}\n`;
  }

  csv += `\nResumo,,,\n`;
  csv += `Total Bruto,R$,${totalAmount.toFixed(2)},${totalHours}h,${totalKm}km\n`;

  const filename = `ganhos_${month || 'completo'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, csv);
  return true;
}

/** Exporta gastos como CSV (Excel-compatible) */
export function exportExpensesCSV(expenses: Expense[], month?: string): boolean {
  const filtered = month ? expenses.filter((e) => getMonth(e.date) === month) : expenses;
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return false;

  const totalAmount = sorted.reduce((s, e) => s + e.amount, 0);
  const monthLabel = month ? formatMonth(month) : 'Todos os meses';

  let csv = 'Data,Categoria,Descrição,Valor\n';

  for (const e of sorted) {
    csv += `${formatDate(e.date)},${CATEGORY_LABELS[e.category] || e.category},${escapeCSV(e.description)},${e.amount.toFixed(2)}\n`;
  }

  csv += `\nResumo,,,\n`;
  csv += `Total de Gastos,R$,,${totalAmount.toFixed(2)}\n`;

  const filename = `gastos_${month || 'completo'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, csv);
  return true;
}

/** Exporta relatório fiscal consolidado como CSV (12 meses) */
export function exportFiscalReportCSV(
  earnings: Earning[],
  expenses: Expense[],
  summaries: MonthlySummary[],
  period: string,
): boolean {
  if (summaries.length === 0) return false;

  const totals = summaries.reduce(
    (acc, s) => ({
      earnings: acc.earnings + s.totalEarnings,
      expenses: acc.expenses + s.totalExpenses,
      reserve: acc.reserve + s.maintenanceReserve,
      profit: acc.profit + s.netProfit,
      hours: acc.hours + s.totalHours,
      km: acc.km + s.totalKm,
    }),
    { earnings: 0, expenses: 0, reserve: 0, profit: 0, hours: 0, km: 0 },
  );

  const avgMonthly = totals.earnings / (summaries.length || 1);
  const avgPerHour = totals.hours > 0 ? totals.earnings / totals.hours : 0;

  let csv = 'RELATÓRIO FISCAL - PERÍODO: ' + period + '\n';
  csv += `Data de Geração,${new Date().toLocaleString('pt-BR')}\n\n`;

  csv += 'RESUMO GERAL\n';
  csv += `Receita Bruta (Ganhos),R$,${totals.earnings.toFixed(2)}\n`;
  csv += `Despesas Totais,R$,${(totals.expenses + totals.reserve).toFixed(2)}\n`;
  csv += `Lucro Líquido,R$,${totals.profit.toFixed(2)}\n`;
  csv += `Média Mensal,R$,${avgMonthly.toFixed(2)}\n`;
  csv += `R$/Hora Média,R$,${avgPerHour.toFixed(2)}\n`;
  csv += `Total de KM,${totals.km}\n\n`;

  csv += 'DETALHAMENTO MENSAL\n';
  csv += 'Mês,Ganhos,Gastos,Reserva,Lucro,Horas,KM\n';

  for (const s of summaries) {
    csv += `${formatMonth(s.month)},${s.totalEarnings.toFixed(2)},${s.totalExpenses.toFixed(2)},${s.maintenanceReserve.toFixed(2)},${s.netProfit.toFixed(2)},${s.totalHours},${s.totalKm}\n`;
  }

  csv += `\nTOTAL,${totals.earnings.toFixed(2)},${totals.expenses.toFixed(2)},${totals.reserve.toFixed(2)},${totals.profit.toFixed(2)},${totals.hours},${totals.km}\n`;

  const filename = `relatorio_fiscal_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, csv);
  return true;
}

/** Exporta consolidado (Earnings + Expenses) */
export function exportConsolidatedCSV(
  earnings: Earning[],
  expenses: Expense[],
  month?: string,
): boolean {
  const filteredEarnings = month
    ? earnings.filter((e) => getMonth(e.date) === month)
    : earnings;
  const filteredExpenses = month
    ? expenses.filter((e) => getMonth(e.date) === month)
    : expenses;

  if (filteredEarnings.length === 0 && filteredExpenses.length === 0) return false;

  let csv = 'RELATÓRIO CONSOLIDADO\n';
  csv += `Período,${month ? formatMonth(month) : 'Completo'}\n`;
  csv += `Data de Geração,${new Date().toLocaleString('pt-BR')}\n\n`;

  const totalEarnings = filteredEarnings.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalEarnings - totalExpenses;

  csv += 'RESUMO\n';
  csv += `Total de Ganhos,R$,${totalEarnings.toFixed(2)}\n`;
  csv += `Total de Gastos,R$,${totalExpenses.toFixed(2)}\n`;
  csv += `Lucro Líquido,R$,${netProfit.toFixed(2)}\n\n`;

  if (filteredEarnings.length > 0) {
    csv += 'GANHOS\n';
    csv += 'Data,Plataforma,Valor,Horas,KM\n';
    for (const e of filteredEarnings) {
      csv += `${formatDate(e.date)},${PLATFORM_LABELS[e.platform] || e.platform},${e.amount.toFixed(2)},${e.hours},${e.km}\n`;
    }
    csv += `\n`;
  }

  if (filteredExpenses.length > 0) {
    csv += 'GASTOS\n';
    csv += 'Data,Categoria,Descrição,Valor\n';
    for (const e of filteredExpenses) {
      csv += `${formatDate(e.date)},${CATEGORY_LABELS[e.category] || e.category},${escapeCSV(e.description)},${e.amount.toFixed(2)}\n`;
    }
  }

  const filename = `consolidado_${month || 'completo'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, csv);
  return true;
}

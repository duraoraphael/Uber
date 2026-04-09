import type { Earning, Expense, MonthlySummary } from '../types';
import { currency } from './utils';
import { getMonth } from './calculations';

/** Exporta ganhos como CSV */
export function exportEarningsCSV(earnings: Earning[], month?: string) {
  const filtered = month ? earnings.filter((e) => getMonth(e.date) === month) : earnings;
  const header = 'Data,Plataforma,Valor (R$),Horas,KM\n';
  const rows = filtered
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => `${e.date},${e.platform},${e.amount.toFixed(2)},${e.hours},${e.km}`)
    .join('\n');
  downloadCSV(header + rows, `ganhos${month ? `-${month}` : ''}.csv`);
}

/** Exporta gastos como CSV */
export function exportExpensesCSV(expenses: Expense[], month?: string) {
  const filtered = month ? expenses.filter((e) => getMonth(e.date) === month) : expenses;
  const header = 'Data,Categoria,Valor (R$),Descrição\n';
  const rows = filtered
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => `${e.date},${e.category},${e.amount.toFixed(2)},"${e.description}"`)
    .join('\n');
  downloadCSV(header + rows, `gastos${month ? `-${month}` : ''}.csv`);
}

/** Exporta relatório fiscal de um período */
export function exportFiscalReport(
  _earnings: Earning[],
  _expenses: Expense[],
  summaries: MonthlySummary[],
  period: string,
) {
  let csv = `RELATÓRIO FISCAL - ${period}\n\n`;
  csv += 'Mês,Ganho Bruto,Gastos Totais,Reserva Manutenção,Lucro Líquido,Horas,KM\n';
  for (const s of summaries) {
    csv += `${s.month},${s.totalEarnings.toFixed(2)},${s.totalExpenses.toFixed(2)},${s.maintenanceReserve.toFixed(2)},${s.netProfit.toFixed(2)},${s.totalHours},${s.totalKm}\n`;
  }

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

  csv += `\nTOTAL,${totals.earnings.toFixed(2)},${totals.expenses.toFixed(2)},${totals.reserve.toFixed(2)},${totals.profit.toFixed(2)},${totals.hours},${totals.km}\n`;
  csv += `\nResumo:\n`;
  csv += `Rendimento Bruto Total: ${currency(totals.earnings)}\n`;
  csv += `Despesas Dedutíveis Total: ${currency(totals.expenses + totals.reserve)}\n`;
  csv += `Lucro Líquido Total: ${currency(totals.profit)}\n`;
  csv += `Média Mensal de Ganho: ${currency(totals.earnings / (summaries.length || 1))}\n`;
  csv += `Média R$/Hora: ${currency(totals.hours > 0 ? totals.earnings / totals.hours : 0)}\n`;

  downloadCSV(csv, `relatorio-fiscal-${period}.csv`);
}

function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

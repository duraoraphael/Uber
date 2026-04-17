import type { Earning, Expense, MonthlySummary } from '../types';
import { currency } from './utils';
import { getMonth } from './calculations';

// ── Helpers para gerar PDF via window.print ──

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

function formatMonth(m: string): string {
  const [y, mo] = m.split('-');
  const names = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${names[parseInt(mo, 10) - 1]} ${y}`;
}

function openPdfWindow(title: string, bodyHtml: string): boolean {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 32px; font-size: 13px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
  .header h1 span { color: #10b981; }
  .header .subtitle { font-size: 13px; color: #64748b; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) td { background: #f8fafc; }
  .total-row td { font-weight: 700; background: #f1f5f9 !important; border-top: 2px solid #e2e8f0; }
  .value { text-align: right; font-variant-numeric: tabular-nums; }
  .positive { color: #059669; }
  .negative { color: #dc2626; }
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .summary-card .val { font-size: 18px; font-weight: 700; color: #0f172a; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
${bodyHtml}
<div class="footer">DriverFinance — Gerado em ${new Date().toLocaleString('pt-BR')}</div>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) {
    URL.revokeObjectURL(url);
    return false; // popup bloqueado pelo navegador
  }
  // Revoga a URL após 60s (tempo suficiente para a janela carregar e imprimir)
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

/** Exporta ganhos como PDF. Retorna false se não há dados ou o popup foi bloqueado. */
export function exportEarningsCSV(earnings: Earning[], month?: string): boolean {
  const filtered = month ? earnings.filter((e) => getMonth(e.date) === month) : earnings;
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return false;

  const totalAmount = sorted.reduce((s, e) => s + e.amount, 0);
  const totalHours = sorted.reduce((s, e) => s + e.hours, 0);
  const totalKm = sorted.reduce((s, e) => s + e.km, 0);
  const monthLabel = month ? formatMonth(month) : 'Todos os meses';

  let body = `
<div class="header">
  <div><h1>Driver<span>Finance</span></h1><div class="subtitle">Relatório de Ganhos</div></div>
  <div style="text-align:right"><strong>${monthLabel}</strong><br/>${sorted.length} registro(s)</div>
</div>
<div class="summary-grid">
  <div class="summary-card"><div class="label">Total Bruto</div><div class="val positive">${currency(totalAmount)}</div></div>
  <div class="summary-card"><div class="label">Total Horas</div><div class="val">${totalHours}h</div></div>
  <div class="summary-card"><div class="label">Total KM</div><div class="val">${totalKm} km</div></div>
</div>
<div class="section">
  <h2>Detalhamento</h2>
  <table>
    <thead><tr><th>Data</th><th>Plataforma</th><th class="value">Valor</th><th class="value">Horas</th><th class="value">KM</th></tr></thead>
    <tbody>`;

  for (const e of sorted) {
    body += `<tr><td>${formatDate(e.date)}</td><td>${PLATFORM_LABELS[e.platform] || e.platform}</td><td class="value">${currency(e.amount)}</td><td class="value">${e.hours}h</td><td class="value">${e.km}</td></tr>`;
  }

  body += `<tr class="total-row"><td colspan="2">TOTAL</td><td class="value">${currency(totalAmount)}</td><td class="value">${totalHours}h</td><td class="value">${totalKm}</td></tr>`;
  body += `</tbody></table></div>`;

  return openPdfWindow(`Ganhos - ${monthLabel}`, body);
}

/** Exporta gastos como PDF. Retorna false se não há dados ou o popup foi bloqueado. */
export function exportExpensesCSV(expenses: Expense[], month?: string): boolean {
  const filtered = month ? expenses.filter((e) => getMonth(e.date) === month) : expenses;
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return false;

  const totalAmount = sorted.reduce((s, e) => s + e.amount, 0);
  const monthLabel = month ? formatMonth(month) : 'Todos os meses';

  // Totals por categoria
  const byCat: Record<string, number> = {};
  for (const e of sorted) {
    byCat[e.category] = (byCat[e.category] || 0) + e.amount;
  }

  let body = `
<div class="header">
  <div><h1>Driver<span>Finance</span></h1><div class="subtitle">Relatório de Gastos</div></div>
  <div style="text-align:right"><strong>${monthLabel}</strong><br/>${sorted.length} registro(s)</div>
</div>
<div class="summary-grid">
  <div class="summary-card"><div class="label">Total Gastos</div><div class="val negative">${currency(totalAmount)}</div></div>
  ${Object.entries(byCat).slice(0, 2).map(([cat, val]) =>
    `<div class="summary-card"><div class="label">${CATEGORY_LABELS[cat] || cat}</div><div class="val">${currency(val)}</div></div>`
  ).join('')}
</div>
<div class="section">
  <h2>Detalhamento</h2>
  <table>
    <thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th class="value">Valor</th></tr></thead>
    <tbody>`;

  for (const e of sorted) {
    body += `<tr><td>${formatDate(e.date)}</td><td>${CATEGORY_LABELS[e.category] || e.category}</td><td>${e.description || '—'}</td><td class="value">${currency(e.amount)}</td></tr>`;
  }

  body += `<tr class="total-row"><td colspan="3">TOTAL</td><td class="value">${currency(totalAmount)}</td></tr>`;
  body += `</tbody></table></div>`;

  return openPdfWindow(`Gastos - ${monthLabel}`, body);
}

/** Exporta relatório fiscal de um período. Retorna false se o popup foi bloqueado. */
export function exportFiscalReport(
  _earnings: Earning[],
  _expenses: Expense[],
  summaries: MonthlySummary[],
  period: string,
): boolean {
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

  let body = `
<div class="header">
  <div><h1>Driver<span>Finance</span></h1><div class="subtitle">Relatório Fiscal</div></div>
  <div style="text-align:right"><strong>${period}</strong><br/>${summaries.length} mês(es)</div>
</div>
<div class="summary-grid">
  <div class="summary-card"><div class="label">Receita Bruta</div><div class="val positive">${currency(totals.earnings)}</div></div>
  <div class="summary-card"><div class="label">Despesas Totais</div><div class="val negative">${currency(totals.expenses + totals.reserve)}</div></div>
  <div class="summary-card"><div class="label">Lucro Líquido</div><div class="val ${totals.profit >= 0 ? 'positive' : 'negative'}">${currency(totals.profit)}</div></div>
</div>
<div class="summary-grid">
  <div class="summary-card"><div class="label">Média Mensal</div><div class="val">${currency(avgMonthly)}</div></div>
  <div class="summary-card"><div class="label">R$/Hora Média</div><div class="val">${currency(avgPerHour)}</div></div>
  <div class="summary-card"><div class="label">Total KM</div><div class="val">${totals.km.toLocaleString('pt-BR')}</div></div>
</div>
<div class="section">
  <h2>Resumo Mensal</h2>
  <table>
    <thead><tr><th>Mês</th><th class="value">Ganhos</th><th class="value">Gastos</th><th class="value">Reserva</th><th class="value">Lucro</th><th class="value">Horas</th><th class="value">KM</th></tr></thead>
    <tbody>`;

  for (const s of summaries) {
    body += `<tr>
      <td>${formatMonth(s.month)}</td>
      <td class="value">${currency(s.totalEarnings)}</td>
      <td class="value">${currency(s.totalExpenses)}</td>
      <td class="value">${currency(s.maintenanceReserve)}</td>
      <td class="value ${s.netProfit >= 0 ? 'positive' : 'negative'}">${currency(s.netProfit)}</td>
      <td class="value">${s.totalHours}h</td>
      <td class="value">${s.totalKm}</td>
    </tr>`;
  }

  body += `<tr class="total-row">
    <td>TOTAL</td>
    <td class="value">${currency(totals.earnings)}</td>
    <td class="value">${currency(totals.expenses)}</td>
    <td class="value">${currency(totals.reserve)}</td>
    <td class="value">${currency(totals.profit)}</td>
    <td class="value">${totals.hours}h</td>
    <td class="value">${totals.km}</td>
  </tr>`;
  body += `</tbody></table></div>`;

  return openPdfWindow(`Relatório Fiscal - ${period}`, body);
}

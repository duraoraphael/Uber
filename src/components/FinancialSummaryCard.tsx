import { Wallet } from 'lucide-react';
import type { MonthlySummary, FixedItem } from '../types';
import { currency } from '../lib/utils';
import { calcFixedTotals } from '../lib/calculations';
import { Card, CardTitle } from './ui/Card';

interface Props {
  summary: MonthlySummary;
  fixedItems: FixedItem[];
}

export function FinancialSummaryCard({ summary, fixedItems }: Props) {
  const { fixedIncome, fixedExpenses } = calcFixedTotals(fixedItems);

  const hasData =
    summary.totalEarnings > 0 || summary.totalExpenses > 0 || fixedIncome > 0 || fixedExpenses > 0;

  if (!hasData) return null;

  const totalIncome = summary.totalEarnings + fixedIncome;
  const totalExpenses = summary.totalExpenses + fixedExpenses + summary.maintenanceReserve;
  const netBalance = totalIncome - totalExpenses;
  const isPositive = netBalance >= 0;

  return (
    <Card>
      <CardTitle>
        <span className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-400" />
          Balanço Mensal Completo
        </span>
      </CardTitle>

      <div className="space-y-3">
        {/* Receitas */}
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400/70">
            Receitas
          </p>
          <div className="space-y-1.5">
            {summary.totalEarnings > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Corridas (variável)</span>
                <span className="font-medium text-slate-200">{currency(summary.totalEarnings)}</span>
              </div>
            )}
            {fixedIncome > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Receitas fixas</span>
                <span className="font-medium text-slate-200">{currency(fixedIncome)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-emerald-500/20 pt-1.5 text-sm font-bold">
              <span className="text-emerald-400">Total receitas</span>
              <span className="text-emerald-400">{currency(totalIncome)}</span>
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400/70">
            Despesas
          </p>
          <div className="space-y-1.5">
            {summary.totalExpenses > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Gastos variáveis</span>
                <span className="font-medium text-slate-200">{currency(summary.totalExpenses)}</span>
              </div>
            )}
            {fixedExpenses > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Despesas fixas</span>
                <span className="font-medium text-slate-200">{currency(fixedExpenses)}</span>
              </div>
            )}
            {summary.maintenanceReserve > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Reserva manutenção</span>
                <span className="font-medium text-slate-200">{currency(summary.maintenanceReserve)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-red-500/20 pt-1.5 text-sm font-bold">
              <span className="text-red-400">Total despesas</span>
              <span className="text-red-400">{currency(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Saldo líquido */}
        <div className={`rounded-xl border p-4 text-center ${
          isPositive
            ? 'border-emerald-500/20 bg-emerald-500/10'
            : 'border-red-500/20 bg-red-500/10'
        }`}>
          <p className="mb-1 text-xs text-slate-400">Saldo líquido do mês</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {currency(netBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isPositive ? '✓ Receitas superando despesas' : '⚠ Despesas superando receitas'}
          </p>
        </div>
      </div>
    </Card>
  );
}

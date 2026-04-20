import { useMemo } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Minus } from 'lucide-react';
import type { Earning, Expense, GoalConfig } from '../types';
import { currency } from '../lib/utils';
import { calcDailyBreakEven, calcAdaptiveDailyGoal, getMonth } from '../lib/calculations';
import { Card } from './ui/Card';

interface Props {
  earnings: Earning[];
  expenses: Expense[];
  goals: GoalConfig;
  month: string;
}

export function BreakEvenWidget({ earnings, expenses, goals, month }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const earningsToday = useMemo(
    () => earnings.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0),
    [earnings, today],
  );

  const earningsThisMonth = useMemo(
    () => earnings.filter((e) => getMonth(e.date) === month).reduce((s, e) => s + e.amount, 0),
    [earnings, month],
  );

  const breakEven = useMemo(
    () => calcDailyBreakEven(expenses, month),
    [expenses, month],
  );

  const { adaptiveGoal, remainingDays } = useMemo(
    () => calcAdaptiveDailyGoal(goals.earningGoal, earningsThisMonth, month),
    [goals.earningGoal, earningsThisMonth, month],
  );

  const profit = earningsToday - breakEven;
  const isProfit = profit > 0;
  const isBreakEven = profit >= 0 && profit < 5;
  const pct = breakEven > 0 ? Math.min((earningsToday / breakEven) * 100, 100) : 0;

  // Only show if we have expense data
  if (breakEven <= 0 && goals.earningGoal <= 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Análise do Dia</h3>
        </div>
        {/* Status badge */}
        {earningsToday > 0 && (
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isProfit && !isBreakEven
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : profit < 0
              ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
          }`}>
            {isProfit && !isBreakEven
              ? <><CheckCircle2 className="h-3 w-3" /> No azul</>
              : profit < 0
              ? <><AlertTriangle className="h-3 w-3" /> No vermelho</>
              : <><Minus className="h-3 w-3" /> No equilíbrio</>}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Break-even */}
        {breakEven > 0 && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700/50 dark:bg-slate-800/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
              Ponto de Equilíbrio
            </p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">{currency(breakEven)}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">custo diário estimado</p>
          </div>
        )}

        {/* Ganho hoje */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700/50 dark:bg-slate-800/50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
            Ganho Hoje
          </p>
          <p className={`text-lg font-extrabold ${
            earningsToday === 0
              ? 'text-slate-400 dark:text-slate-500'
              : 'text-slate-800 dark:text-white'
          }`}>
            {currency(earningsToday)}
          </p>
          {profit !== 0 && breakEven > 0 && (
            <p className={`text-[11px] font-medium mt-0.5 ${
              profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {profit > 0 ? '+' : ''}{currency(profit)} de lucro
            </p>
          )}
        </div>

        {/* Meta adaptativa */}
        {goals.earningGoal > 0 && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700/50 dark:bg-slate-800/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
              Meta Hoje
            </p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">{currency(adaptiveGoal)}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
              para fechar a meta em {remainingDays}d
            </p>
          </div>
        )}
      </div>

      {/* Progress bar toward break-even */}
      {breakEven > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-gray-400 dark:text-slate-500 mb-1.5">
            <span>Progresso em direção ao equilíbrio</span>
            <span className="font-semibold">{pct.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

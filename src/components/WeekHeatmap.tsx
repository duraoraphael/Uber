import { useMemo } from 'react';
import type { Earning, GoalConfig } from '../types';
import { currency } from '../lib/utils';
import { Card } from './ui/Card';
import { CalendarDays } from 'lucide-react';

interface Props {
  earnings: Earning[];
  goals: GoalConfig;
  month: string;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDayColor(amount: number, dailyGoal: number): string {
  if (amount === 0) return 'bg-gray-100 dark:bg-slate-800';
  if (dailyGoal <= 0) {
    if (amount > 200) return 'bg-emerald-500';
    if (amount > 100) return 'bg-emerald-400';
    return 'bg-emerald-300';
  }
  const pct = amount / dailyGoal;
  if (pct >= 1.2) return 'bg-emerald-600 dark:bg-emerald-500';
  if (pct >= 1.0) return 'bg-emerald-500 dark:bg-emerald-400';
  if (pct >= 0.7) return 'bg-blue-400 dark:bg-blue-500';
  if (pct >= 0.4) return 'bg-amber-400 dark:bg-amber-500';
  return 'bg-red-300 dark:bg-red-500/60';
}

function getDayLabel(amount: number, dailyGoal: number): string {
  if (amount === 0) return 'Sem registro';
  if (dailyGoal <= 0) return currency(amount);
  const pct = (amount / dailyGoal) * 100;
  return `${currency(amount)} (${pct.toFixed(0)}% da meta)`;
}

export function WeekHeatmap({ earnings, goals, month }: Props) {
  const { days, hasData } = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0).getDate();

    // Map: date string → total earnings
    const earningsByDay: Record<string, number> = {};
    for (const e of earnings) {
      if (e.date.startsWith(month)) {
        earningsByDay[e.date] = (earningsByDay[e.date] ?? 0) + e.amount;
      }
    }

    // Build grid starting from the weekday of the 1st
    const startWeekday = firstDay.getDay(); // 0=Sun
    const cells: Array<{ date: string; day: number; amount: number; isCurrentMonth: boolean } | null> = [];

    // Empty cells before month start
    for (let i = 0; i < startWeekday; i++) cells.push(null);

    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${month}-${String(d).padStart(2, '0')}`;
      cells.push({ date: dateStr, day: d, amount: earningsByDay[dateStr] ?? 0, isCurrentMonth: true });
    }

    // Pad to complete the last week
    while (cells.length % 7 !== 0) cells.push(null);

    const hasData = Object.values(earningsByDay).some((v) => v > 0);
    return { days: cells, hasData };
  }, [earnings, month]);

  const dailyGoal = goals.earningGoal > 0 ? goals.earningGoal / 30 : 0;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-purple-500 dark:text-purple-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Mapa do Mês</h3>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-300 dark:bg-red-500/60" /> Baixo
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Médio
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Ótimo
          </span>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-slate-600 pb-1">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const isToday = cell.date === today;
          const colorClass = getDayColor(cell.amount, dailyGoal);
          const tooltipText = getDayLabel(cell.amount, dailyGoal);

          return (
            <div
              key={cell.date}
              title={`${cell.date} — ${tooltipText}`}
              className={`
                aspect-square rounded-md flex items-center justify-center
                text-[10px] font-semibold transition-all cursor-default
                ${colorClass}
                ${cell.amount > 0 ? 'text-white' : 'text-gray-300 dark:text-slate-700'}
                ${isToday ? 'ring-2 ring-offset-1 ring-emerald-500 dark:ring-offset-slate-900' : ''}
              `}
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      {!hasData && (
        <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-600">
          Nenhum ganho registrado este mês. Os dias aparecem coloridos conforme você registra.
        </p>
      )}
    </Card>
  );
}

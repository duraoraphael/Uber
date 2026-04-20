import { useMemo } from 'react';
import { Clock, Sun, Sunset, Moon } from 'lucide-react';
import type { Earning } from '../types';
import { currency } from '../lib/utils';
import { calcShiftAnalysis } from '../lib/calculations';
import { Card } from './ui/Card';
import type { ShiftData } from '../lib/calculations';

interface Props {
  earnings: Earning[];
  month: string;
}

const shiftConfig: Record<string, { icon: typeof Sun; color: string; bgClass: string; borderClass: string; textClass: string }> = {
  morning: {
    icon: Sun,
    color: '#f59e0b',
    bgClass: 'bg-amber-50 dark:bg-amber-500/10',
    borderClass: 'border-amber-200 dark:border-amber-500/20',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  afternoon: {
    icon: Sunset,
    color: '#3b82f6',
    bgClass: 'bg-blue-50 dark:bg-blue-500/10',
    borderClass: 'border-blue-200 dark:border-blue-500/20',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  night: {
    icon: Moon,
    color: '#8b5cf6',
    bgClass: 'bg-violet-50 dark:bg-violet-500/10',
    borderClass: 'border-violet-200 dark:border-violet-500/20',
    textClass: 'text-violet-600 dark:text-violet-400',
  },
};

function ShiftBar({ data, maxAmount }: { data: ShiftData; maxAmount: number }) {
  const cfg = shiftConfig[data.shift];
  const Icon = cfg.icon;
  const pct = maxAmount > 0 ? (data.totalAmount / maxAmount) * 100 : 0;

  return (
    <div className={`rounded-xl border p-3 ${cfg.bgClass} ${cfg.borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${cfg.textClass}`} />
          <span className={`text-sm font-bold ${cfg.textClass}`}>{data.label}</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500">{data.count} reg.</span>
      </div>

      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-800/50 overflow-hidden mb-2">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: cfg.color }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-400 dark:text-slate-500">Total</p>
          <p className="font-bold text-slate-800 dark:text-white">
            {data.totalAmount > 0 ? currency(data.totalAmount) : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-slate-500">R$/hora</p>
          <p className="font-bold text-slate-800 dark:text-white">
            {data.avgPerHour > 0 ? currency(data.avgPerHour) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ShiftAnalysisCard({ earnings, month }: Props) {
  const shifts = useMemo(() => calcShiftAnalysis(earnings, month), [earnings, month]);

  const hasShiftData = shifts.some((s) => s.count > 0);
  const bestShift = hasShiftData
    ? shifts.reduce((best, s) => (s.avgPerHour > best.avgPerHour ? s : best))
    : null;
  const maxAmount = Math.max(...shifts.map((s) => s.totalAmount), 1);

  if (!hasShiftData) {
    // Show teaser if there are earnings but no shift data yet
    const hasEarnings = earnings.some((e) => e.date.startsWith(month));
    if (!hasEarnings) return null;

    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Análise por Turno</h3>
        </div>
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-5 text-center">
          <Clock className="h-8 w-8 text-gray-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500 dark:text-slate-500">
            Selecione o turno ao registrar ganhos
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">
            Descubra qual horário você ganha mais por hora
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Análise por Turno</h3>
        </div>
        {bestShift && bestShift.avgPerHour > 0 && (
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Melhor: {shiftConfig[bestShift.shift].icon && bestShift.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {shifts.map((s) => (
          <ShiftBar key={s.shift} data={s} maxAmount={maxAmount} />
        ))}
      </div>
    </Card>
  );
}

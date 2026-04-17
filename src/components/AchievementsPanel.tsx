import { useMemo } from 'react';
import { Trophy, Star, Zap, Flame, Target, TrendingUp, Award, Crown } from 'lucide-react';
import { Card, CardTitle } from './ui/Card';
import type { Earning, Expense, MonthlySummary } from '../types';

interface Props {
  earnings: Earning[];
  expenses: Expense[];
  summary: MonthlySummary;
  theme: 'dark' | 'light';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  bgColor: string;
  unlocked: boolean;
  progress?: { current: number; target: number };
}

export function AchievementsPanel({ earnings, expenses, summary, theme }: Props) {
  const isDark = theme === 'dark';

  const achievements = useMemo<Achievement[]>(() => {
    const totalRegistros = earnings.length + expenses.length;
    const monthEarnings = earnings.filter((e) => e.date.startsWith(summary.month));
    const bestDay = getBestDayAmount(monthEarnings);
    const daysWorked = new Set(monthEarnings.map((e) => e.date)).size;
    const platforms = new Set(monthEarnings.map((e) => e.platform)).size;

    return [
      {
        id: 'first-record',
        title: 'Primeiro Registro',
        description: 'Cadastre seu primeiro ganho ou gasto',
        icon: Star,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/15',
        unlocked: totalRegistros > 0,
        progress: { current: Math.min(totalRegistros, 1), target: 1 },
      },
      {
        id: 'week-streak',
        title: 'Semana Completa',
        description: 'Registre ganhos em 7 dias no mês',
        icon: Flame,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/15',
        unlocked: daysWorked >= 7,
        progress: { current: Math.min(daysWorked, 7), target: 7 },
      },
      {
        id: 'centurion',
        title: 'Centurião',
        description: 'Ganhe R$ 1.000 em um único dia',
        icon: Zap,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/15',
        unlocked: bestDay >= 1000,
        progress: { current: Math.min(bestDay, 1000), target: 1000 },
      },
      {
        id: 'five-k',
        title: 'Meta 5K',
        description: 'Alcance R$ 5.000 em ganhos no mês',
        icon: Target,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/15',
        unlocked: summary.totalEarnings >= 5000,
        progress: { current: Math.min(summary.totalEarnings, 5000), target: 5000 },
      },
      {
        id: 'ten-k',
        title: 'Mestre 10K',
        description: 'Alcance R$ 10.000 em ganhos no mês',
        icon: Crown,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/15',
        unlocked: summary.totalEarnings >= 10000,
        progress: { current: Math.min(summary.totalEarnings, 10000), target: 10000 },
      },
      {
        id: 'multi-platform',
        title: 'Multi-plataforma',
        description: 'Use 2 ou mais plataformas no mês',
        icon: TrendingUp,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/15',
        unlocked: platforms >= 2,
        progress: { current: Math.min(platforms, 2), target: 2 },
      },
      {
        id: 'profit-positive',
        title: 'No Lucro!',
        description: 'Termine o mês com lucro positivo',
        icon: Award,
        color: 'text-green-400',
        bgColor: 'bg-green-500/15',
        unlocked: summary.netProfit > 0,
      },
      {
        id: 'data-nerd',
        title: 'Data Nerd',
        description: 'Tenha 50+ registros no total',
        icon: Trophy,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/15',
        unlocked: totalRegistros >= 50,
        progress: { current: Math.min(totalRegistros, 50), target: 50 },
      },
    ];
  }, [earnings, expenses, summary]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card>
      <CardTitle>
        <span className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Conquistas
          <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
            {unlockedCount}/{achievements.length}
          </span>
        </span>
      </CardTitle>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {achievements.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.id}
              className={`relative flex flex-col items-center text-center rounded-xl p-3 border transition-all ${
                a.unlocked
                  ? `${a.bgColor} ${isDark ? 'border-white/10' : 'border-gray-200'}`
                  : isDark
                    ? 'bg-slate-800/30 border-slate-800 opacity-50 grayscale'
                    : 'bg-gray-100/50 border-gray-200 opacity-50 grayscale'
              }`}
            >
              <div className={`mb-1.5 flex h-10 w-10 items-center justify-center rounded-full ${
                a.unlocked ? a.bgColor : isDark ? 'bg-slate-700' : 'bg-gray-200'
              }`}>
                <Icon className={`h-5 w-5 ${a.unlocked ? a.color : isDark ? 'text-slate-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-[11px] font-bold leading-tight ${
                a.unlocked ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-slate-500' : 'text-gray-400')
              }`}>
                {a.title}
              </p>
              <p className={`text-[9px] leading-tight mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {a.description}
              </p>
              {a.progress && (
                <div className="w-full mt-2">
                  <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${a.unlocked ? 'bg-emerald-500' : isDark ? 'bg-slate-600' : 'bg-gray-300'}`}
                      style={{ width: `${(a.progress.current / a.progress.target) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {a.unlocked && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function getBestDayAmount(earnings: Earning[]): number {
  const byDay: Record<string, number> = {};
  for (const e of earnings) {
    byDay[e.date] = (byDay[e.date] || 0) + e.amount;
  }
  return Math.max(0, ...Object.values(byDay));
}

import { useMemo } from 'react';
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import type { Earning, GoalConfig } from '../types';
import { currency } from '../lib/utils';
import { Card, CardTitle } from './ui/Card';

interface Props {
  earnings: Earning[];
  goals: GoalConfig;
  theme: 'light' | 'dark';
}

export function DailyGoalWidget({ earnings, goals, theme }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Calcular ganhos de hoje
  const earningsToday = useMemo(() => {
    return earnings
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [earnings, today]);

  // Calcular ganhos do mês
  const earningsThisMonth = useMemo(() => {
    return earnings
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [earnings, currentMonth]);

  if (goals.earningGoal <= 0) {
    return null; // Não mostra se não há meta definida
  }

  const dailyGoal = goals.earningGoal / 30; // Meta diária aproximada
  const remainingToday = Math.max(0, dailyGoal - earningsToday);
  const progressToday = Math.min((earningsToday / dailyGoal) * 100, 100);
  const progressMonth = Math.min((earningsThisMonth / goals.earningGoal) * 100, 100);
  const remainingMonth = Math.max(0, goals.earningGoal - earningsThisMonth);

  const isTodayComplete = earningsToday >= dailyGoal;
  const isMonthComplete = earningsThisMonth >= goals.earningGoal;

  return (
    <Card>
      <CardTitle>
        <span className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-400" /> Meta do Dia
        </span>
      </CardTitle>

      <div className="space-y-5">
        {/* Progresso do Dia */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isTodayComplete
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-wide font-semibold ${
                  theme === 'light' ? 'text-gray-500' : 'text-slate-400'
                }`}>
                  Hoje
                </p>
                <p className={`text-sm font-bold ${
                  isTodayComplete
                    ? 'text-emerald-400'
                    : theme === 'light'
                      ? 'text-gray-900'
                      : 'text-white'
                }`}>
                  {currency(earningsToday)} / {currency(dailyGoal)}
                </p>
              </div>
            </div>
            <div
              className={`text-right ${isTodayComplete ? 'text-emerald-400' : theme === 'light' ? 'text-gray-600' : 'text-slate-300'}`}
            >
              <p className="text-2xl font-bold">{progressToday.toFixed(0)}%</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className={`h-3 rounded-full overflow-hidden ${
            theme === 'light' ? 'bg-gray-200' : 'bg-slate-800'
          }`}>
            <div
              className={`h-3 rounded-full transition-all duration-700 ease-out ${
                isTodayComplete ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressToday}%` }}
            />
          </div>

          {/* Status */}
          <div className="mt-2 text-xs">
            {isTodayComplete ? (
              <div className="flex items-center gap-1.5 text-emerald-500">
                <Zap className="h-3 w-3" />
                <span className="font-medium">Meta do dia atingida!</span>
              </div>
            ) : (
              <div className={theme === 'light' ? 'text-gray-600' : 'text-slate-400'}>
                <span className="font-medium">
                  Faltam {currency(remainingToday)} para atingir a meta de hoje
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Divider visual */}
        <div className={`h-px ${theme === 'light' ? 'bg-gray-200' : 'bg-slate-700/50'}`} />

        {/* Progresso do Mês */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isMonthComplete
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-slate-800 text-slate-300'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-wide font-semibold ${
                  theme === 'light' ? 'text-gray-500' : 'text-slate-400'
                }`}>
                  Este Mês
                </p>
                <p className={`text-sm font-bold ${
                  isMonthComplete
                    ? 'text-emerald-400'
                    : theme === 'light'
                      ? 'text-gray-900'
                      : 'text-white'
                }`}>
                  {currency(earningsThisMonth)} / {currency(goals.earningGoal)}
                </p>
              </div>
            </div>
            <div
              className={`text-right ${isMonthComplete ? 'text-emerald-400' : theme === 'light' ? 'text-gray-600' : 'text-slate-300'}`}
            >
              <p className="text-2xl font-bold">{progressMonth.toFixed(0)}%</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className={`h-3 rounded-full overflow-hidden ${
            theme === 'light' ? 'bg-gray-200' : 'bg-slate-800'
          }`}>
            <div
              className={`h-3 rounded-full transition-all duration-700 ease-out ${
                isMonthComplete ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressMonth}%` }}
            />
          </div>

          {/* Status */}
          <div className="mt-2 text-xs">
            {isMonthComplete ? (
              <div className="flex items-center gap-1.5 text-emerald-500">
                <Zap className="h-3 w-3" />
                <span className="font-medium">Meta do mês atingida! Parabéns 🎉</span>
              </div>
            ) : (
              <div className={theme === 'light' ? 'text-gray-600' : 'text-slate-400'}>
                <span className="font-medium">
                  Faltam {currency(remainingMonth)} para completar a meta mensal
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

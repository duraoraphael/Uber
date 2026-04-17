import { useMemo } from 'react';
import { Trophy, Calendar, TrendingUp, Share2 } from 'lucide-react';
import { Card, CardTitle } from './ui/Card';
import type { Earning, MonthlySummary, GoalConfig } from '../types';
import { currency } from '../lib/utils';

interface Props {
  earnings: Earning[];
  summary: MonthlySummary;
  goals: GoalConfig;
  month: string;
  theme: 'dark' | 'light';
}

interface DayRank {
  date: string;
  amount: number;
  hours: number;
  km: number;
  trips: number;
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function formatMonthLabel(m: string): string {
  const [y, mo] = m.split('-');
  const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${names[parseInt(mo, 10) - 1]} ${y}`;
}

function getDaysRemainingInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  const today = new Date();
  const lastDay = new Date(y, m, 0).getDate();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
  if (!isCurrentMonth) return 0;
  return Math.max(0, lastDay - today.getDate());
}

function getWeekdayName(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

export function DailyRanking({ earnings, summary, goals, month, theme }: Props) {
  const isDark = theme === 'dark';

  const ranking = useMemo<DayRank[]>(() => {
    const monthEarnings = earnings.filter((e) => e.date.startsWith(month));
    const byDay: Record<string, DayRank> = {};
    for (const e of monthEarnings) {
      if (!byDay[e.date]) {
        byDay[e.date] = { date: e.date, amount: 0, hours: 0, km: 0, trips: 0 };
      }
      byDay[e.date].amount += e.amount;
      byDay[e.date].hours += e.hours;
      byDay[e.date].km += e.km;
      byDay[e.date].trips += 1;
    }
    return Object.values(byDay).sort((a, b) => b.amount - a.amount);
  }, [earnings, month]);

  const daysRemaining = getDaysRemainingInMonth(month);
  const remaining = Math.max(0, (goals.earningGoal || 0) - summary.totalEarnings);
  const dailyNeeded = daysRemaining > 0 ? remaining / daysRemaining : 0;
  const daysWorked = ranking.length;
  const avgPerDay = daysWorked > 0 ? summary.totalEarnings / daysWorked : 0;

  const handleShare = async () => {
    const monthLabel = formatMonthLabel(month);
    const text = [
      `🏆 Meu resumo ${monthLabel} — DriverFinance`,
      `💰 Ganhos: ${currency(summary.totalEarnings)}`,
      `📊 Lucro: ${currency(summary.netProfit)}`,
      `⏱️ Horas: ${summary.totalHours}h`,
      `🚗 KM: ${summary.totalKm}`,
      summary.earningsPerHour > 0 ? `💵 R$/h: ${currency(summary.earningsPerHour)}` : '',
      `\n📲 Baixe o DriverFinance!`,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: `DriverFinance — ${monthLabel}`, text });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Texto copiado! Cole onde quiser compartilhar.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Meta Diária Inteligente */}
      {goals.earningGoal > 0 && (
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Meta Diária Inteligente
            </span>
          </CardTitle>
          <div className={`grid grid-cols-3 gap-3`}>
            <div className={`rounded-xl p-3 text-center border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-[10px] uppercase tracking-wide font-medium mb-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Média/dia</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currency(avgPerDay)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center border ${
              remaining <= 0
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-blue-500/10 border-blue-500/20'
            }`}>
              <p className={`text-[10px] uppercase tracking-wide font-medium mb-1 ${remaining <= 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
                {remaining <= 0 ? 'Meta batida!' : 'Falta/dia'}
              </p>
              <p className={`text-lg font-bold ${remaining <= 0 ? 'text-emerald-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
                {remaining <= 0 ? '✅' : daysRemaining > 0 ? currency(dailyNeeded) : '—'}
              </p>
            </div>
            <div className={`rounded-xl p-3 text-center border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-[10px] uppercase tracking-wide font-medium mb-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Dias restantes</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{daysRemaining > 0 ? daysRemaining : '—'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Ranking dos Melhores Dias */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Melhores Dias do Mês
            </span>
          </CardTitle>
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-blue-500/15 border border-blue-500/20 text-blue-400 hover:bg-blue-500/25'
                : 'bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartilhar
          </button>
        </div>

        {ranking.length === 0 ? (
          <p className={`text-sm text-center py-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Nenhum ganho registrado neste mês
          </p>
        ) : (
          <div className="space-y-1.5">
            {ranking.slice(0, 5).map((day, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              const pct = ranking[0].amount > 0 ? (day.amount / ranking[0].amount) * 100 : 0;
              return (
                <div
                  key={day.date}
                  className={`relative flex items-center gap-3 rounded-xl p-3 border overflow-hidden transition-all ${
                    i === 0
                      ? isDark
                        ? 'bg-amber-500/10 border-amber-500/20'
                        : 'bg-amber-50 border-amber-200'
                      : isDark
                        ? 'bg-slate-800/30 border-slate-800'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Background bar */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                      i === 0 ? 'bg-amber-500/10' : isDark ? 'bg-slate-700/30' : 'bg-gray-100'
                    }`}
                    style={{ width: `${pct}%` }}
                  />

                  <span className="relative text-lg z-10">{medal || `${i + 1}º`}</span>

                  <div className="relative flex-1 z-10">
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-3 w-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {formatDate(day.date)} ({getWeekdayName(day.date)})
                      </span>
                    </div>
                    <div className={`flex items-center gap-3 mt-0.5 text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      <span>{day.trips} corrida{day.trips > 1 ? 's' : ''}</span>
                      <span>{day.hours}h</span>
                      <span>{day.km}km</span>
                    </div>
                  </div>

                  <span className={`relative z-10 text-sm font-bold ${
                    i === 0 ? 'text-amber-400' : isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currency(day.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

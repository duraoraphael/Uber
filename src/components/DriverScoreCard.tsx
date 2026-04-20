import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import type { MonthlySummary, GoalConfig } from '../types';
import { calcDriverScore } from '../lib/calculations';
import { Card } from './ui/Card';

interface Props {
  summary: MonthlySummary;
  goals: GoalConfig;
}

function ScoreArc({ score }: { score: number }) {
  // SVG arc for score visualization
  const radius = 52;
  const cx = 64;
  const cy = 64;
  const strokeWidth = 10;

  // Arc spans 240° (from 150° to 390°/30°)
  const totalAngle = 240;
  const startAngle = 150;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function describeArc(start: number, end: number) {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const scoreAngle = (score / 100) * totalAngle;
  const endAngle = startAngle + scoreAngle;

  const color =
    score >= 75 ? '#10b981' :
    score >= 50 ? '#3b82f6' :
    score >= 25 ? '#f59e0b' : '#ef4444';

  const label =
    score >= 80 ? 'Excelente' :
    score >= 60 ? 'Bom' :
    score >= 40 ? 'Regular' : 'Baixo';

  return (
    <div className="relative flex flex-col items-center">
      <svg width="128" height="96" viewBox="0 0 128 128" className="overflow-visible">
        {/* Track */}
        <path
          d={describeArc(startAngle, startAngle + totalAngle)}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-gray-100 dark:text-slate-800"
        />
        {/* Score arc */}
        {score > 0 && (
          <path
            d={describeArc(startAngle, Math.min(endAngle, startAngle + totalAngle - 0.1))}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        )}
        {/* Score text */}
        <text x={cx} y={cy + 8} textAnchor="middle" className="text-slate-900 dark:text-white" fill="currentColor" fontSize="26" fontWeight="800">
          {score}
        </text>
      </svg>
      <p className="text-xs font-semibold -mt-2" style={{ color }}>{label}</p>
    </div>
  );
}

export function DriverScoreCard({ summary, goals }: Props) {
  const score = useMemo(() => calcDriverScore(summary, goals), [summary, goals]);

  if (summary.totalEarnings === 0) return null;

  const metrics = [
    {
      label: 'R$/hora',
      value: summary.totalHours > 0 ? `R$ ${summary.earningsPerHour.toFixed(2)}` : '—',
      benchmark: 'meta: R$50/h',
      pct: Math.min(100, summary.totalHours > 0 ? (summary.earningsPerHour / 50) * 100 : 0),
      color: '#10b981',
    },
    {
      label: 'R$/km',
      value: summary.totalKm > 0 ? `R$ ${summary.earningsPerKm.toFixed(2)}` : '—',
      benchmark: 'meta: R$0,55/km',
      pct: Math.min(100, summary.totalKm > 0 ? (summary.earningsPerKm / 0.55) * 100 : 0),
      color: '#3b82f6',
    },
    {
      label: 'Meta mensal',
      value: goals.earningGoal > 0
        ? `${Math.min(100, Math.round((summary.totalEarnings / goals.earningGoal) * 100))}%`
        : '—',
      benchmark: 'do objetivo atingido',
      pct: goals.earningGoal > 0
        ? Math.min(100, (summary.totalEarnings / goals.earningGoal) * 100)
        : 0,
      color: '#f59e0b',
    },
  ];

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-amber-500 dark:text-amber-400" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Score de Eficiência</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <ScoreArc score={score} />

        <div className="flex-1 w-full space-y-3">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-600 dark:text-slate-400">{m.label}</span>
                <span className="font-bold text-slate-800 dark:text-white">{m.value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-0.5">{m.benchmark}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

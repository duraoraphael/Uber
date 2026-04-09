import { useState } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, CheckCircle, RefreshCw, Brain } from 'lucide-react';
import type { AIInsight } from '../types';
import { Card, CardTitle } from './ui/Card';

interface Props {
  insights: AIInsight[];
  onRefresh?: () => void;
}

const iconMap = {
  warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
  tip: <Lightbulb className="h-5 w-5 text-blue-400" />,
  positive: <CheckCircle className="h-5 w-5 text-emerald-400" />,
};

const bgMap = {
  warning: 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10',
  tip: 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10',
  positive: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10',
};

const labelMap = {
  warning: { text: 'Atenção', color: 'text-amber-400' },
  tip: { text: 'Dica', color: 'text-blue-400' },
  positive: { text: 'Positivo', color: 'text-emerald-400' },
};

export function InsightsPanel({ insights, onRefresh }: Props) {
  const [analyzing, setAnalyzing] = useState(false);

  function handleRefresh() {
    setAnalyzing(true);
    setTimeout(() => {
      onRefresh?.();
      setAnalyzing(false);
    }, 1500);
  }

  return (
    <div className="animate-page space-y-5 sm:space-y-7">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="mb-0!">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Insights de IA
            </span>
          </CardTitle>
          <button
            onClick={handleRefresh}
            disabled={analyzing}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600/20 border border-purple-500/20 px-3.5 py-2 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-600/30 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analisando...' : 'Atualizar'}
          </button>
        </div>

        {/* Card de "IA analisando" */}
        {analyzing && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 animate-page">
            <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-purple-300">Analisando seus dados...</p>
              <p className="text-xs text-purple-400/60">A IA está processando seus registros</p>
            </div>
          </div>
        )}

        <p className="mb-4 text-xs sm:text-sm text-slate-500">
          Análise inteligente dos seus dados — conselhos para maximizar seu lucro.
        </p>

        {insights.length === 0 && !analyzing ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700">
              <Brain className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">Sem insights disponíveis</p>
            <p className="text-xs text-slate-600 mt-1">Adicione registros para a IA analisar</p>
          </div>
        ) : (
          <ul className="space-y-3 sm:space-y-4">
            {insights.map((insight, i) => (
              <li
                key={insight.id}
                className={`animate-item flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border p-3 sm:p-4 transition-colors cursor-default ${bgMap[insight.type]}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mt-0.5 shrink-0">{iconMap[insight.type]}</div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold mb-1 ${labelMap[insight.type].color}`}>
                    {labelMap[insight.type].text}
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed">{insight.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

import { useState } from 'react';
import {
  DollarSign,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Rocket,
  BarChart3,
  Shield,
  Zap,
} from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const ONBOARDING_KEY = 'driverfinance_onboarding_done';

export function isOnboardingDone(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

const steps = [
  {
    icon: Rocket,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    title: 'Bem-vindo ao DriverFinance!',
    description: 'Seu app completo para controlar finanças como motorista de app. Vamos te mostrar como usar!',
    features: [
      'Controle de ganhos por plataforma',
      'Gestão de gastos e combustível',
      'Análise inteligente com IA',
      'Relatórios em PDF',
    ],
  },
  {
    icon: DollarSign,
    color: 'text-green-400',
    bg: 'bg-green-500/15',
    title: 'Registre seus Ganhos',
    description: 'Adicione seus ganhos separando por plataforma (Uber, 99 ou Outros). Informe horas e quilômetros para uma análise precisa.',
    features: [
      'Toque no + para adicionar rapidamente',
      'Separe por plataforma para comparar',
      'O app calcula R$/hora e R$/km',
      'Edite ou delete a qualquer momento',
    ],
  },
  {
    icon: BarChart3,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    title: 'Dashboard Inteligente',
    description: 'Visualize seu desempenho com gráficos, KPIs e comparação com o mês anterior automaticamente.',
    features: [
      'KPIs de lucro, horas e R$/km',
      'Gráficos de evolução mensal',
      'Ranking dos melhores dias',
      'Conquistas para te motivar!',
    ],
  },
  {
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    title: 'Insights com IA',
    description: 'Nossa IA analisa seus dados e gera dicas personalizadas de economia, metas e alertas sobre seus gastos.',
    features: [
      'Análise automática de combustível',
      'Sugestões de meta diária',
      'Alertas de gastos anômalos',
      'Comparação com benchmarks',
    ],
  },
  {
    icon: Shield,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    title: 'Seus dados são seus!',
    description: 'Tudo fica salvo no seu navegador. Nada vai para servidores externos. Faça backup em JSON quando quiser.',
    features: [
      'Dados 100% no seu dispositivo',
      'Exportação em PDF e JSON',
      'Backup e restauração fácil',
      'Sem cadastro obrigatório',
    ],
  },
];

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg">
      <div className="w-full max-w-md mx-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-emerald-400' : i < step ? 'w-4 bg-emerald-400/40' : 'w-4 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center animate-page">
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl ${current.bg}`}>
            <Icon className={`h-10 w-10 ${current.color}`} />
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-3">{current.title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">{current.description}</p>

          <div className="text-left space-y-2.5 mb-8">
            {current.features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-800/50 border border-slate-800 p-3">
                <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <button
              onClick={finish}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Pular
            </button>
          )}

          <button
            onClick={isLast ? finish : () => setStep(step + 1)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            {isLast ? 'Começar!' : 'Próximo'}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  Car,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useAppData } from './hooks/useAppData';
import { computeMonthlySummary } from './lib/calculations';
import { generateInsights } from './lib/ai-insights';
import { Dashboard } from './components/Dashboard';
import { EarningsForm } from './components/EarningsForm';
import { ExpensesForm } from './components/ExpensesForm';
import { VehiclePanel } from './components/VehiclePanel';
import { InsightsPanel } from './components/InsightsPanel';
import { MonthSelector } from './components/MonthSelector';
import { QuickAddModal } from './components/QuickAddModal';
import { ToastProvider, useToast } from './components/ui/Toast';

type Tab = 'dashboard' | 'financas' | 'veiculo' | 'insights';

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'financas', label: 'Finanças', icon: DollarSign },
  { id: 'veiculo', label: 'Veículo', icon: Car },
  { id: 'insights', label: 'Insights', icon: Sparkles },
];

function AppContent() {
  const {
    data,
    addEarning,
    removeEarning,
    addExpense,
    removeExpense,
    setVehicle,
    setMaintenanceConfig,
  } = useAppData();

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const summary = useMemo(
    () => computeMonthlySummary(data.earnings, data.expenses, data.maintenanceConfig, month),
    [data.earnings, data.expenses, data.maintenanceConfig, month],
  );

  const prevMonth = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    return `${py}-${String(pm).padStart(2, '0')}`;
  }, [month]);

  const prevSummary = useMemo(
    () => computeMonthlySummary(data.earnings, data.expenses, data.maintenanceConfig, prevMonth),
    [data.earnings, data.expenses, data.maintenanceConfig, prevMonth],
  );

  const [insightsKey, setInsightsKey] = useState(0);

  const insights = useMemo(
    () => generateInsights(summary, prevSummary.totalEarnings > 0 ? prevSummary : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summary, prevSummary, insightsKey],
  );

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab as Tab);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-300">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="container-app flex items-center justify-between h-14 sm:h-16">
          <h1 className="text-lg font-bold tracking-tight text-white">
            Driver<span className="text-emerald-400">Finance</span>
          </h1>

          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 container-app py-4 sm:py-6 lg:py-8 pb-24 sm:pb-8">
        <div className="mb-4 sm:mb-6">
          <MonthSelector month={month} onChange={setMonth} />
        </div>

        {activeTab === 'dashboard' && (
          <Dashboard summary={summary} onNavigate={handleNavigate} />
        )}

        {activeTab === 'financas' && (
          <div className="animate-page grid gap-4 sm:gap-6 lg:grid-cols-2">
            <EarningsForm
              earnings={data.earnings}
              month={month}
              onAdd={(e) => {
                addEarning(e);
                toast('Ganho adicionado!', 'success');
              }}
              onRemove={(id) => {
                removeEarning(id);
                toast('Ganho removido', 'success');
              }}
            />
            <ExpensesForm
              expenses={data.expenses}
              month={month}
              onAdd={(e) => {
                addExpense(e);
                toast('Gasto adicionado!', 'success');
              }}
              onRemove={(id) => {
                removeExpense(id);
                toast('Gasto removido', 'success');
              }}
            />
          </div>
        )}

        {activeTab === 'veiculo' && (
          <VehiclePanel
            vehicle={data.vehicle}
            config={data.maintenanceConfig}
            totalKm={summary.totalKm}
            totalEarnings={summary.totalEarnings}
            onSaveVehicle={(v) => {
              setVehicle(v);
              toast('Veículo salvo!', 'success');
            }}
            onSaveConfig={(c) => {
              setMaintenanceConfig(c);
              toast('Configuração atualizada!', 'success');
            }}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsPanel
            insights={insights}
            onRefresh={() => setInsightsKey((k) => k + 1)}
          />
        )}
      </main>

      {/* ── FAB ── */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 transition-transform hover:scale-105 active:scale-90 cursor-pointer animate-fab right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 sm:right-6"
        aria-label="Adicionar rápido"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Quick Add Modal */}
      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onAddEarning={(e) => {
          addEarning(e);
          toast('Ganho adicionado!', 'success');
        }}
        onAddExpense={(e) => {
          addExpense(e);
          toast('Gasto adicionado!', 'success');
        }}
      />

      {/* ── Bottom Tab Bar (mobile) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around bg-slate-900 border-t border-slate-800 pt-1 sm:hidden safe-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors cursor-pointer active:scale-90 ${
                active ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && (
                <span className="absolute -top-1 h-0.5 w-6 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

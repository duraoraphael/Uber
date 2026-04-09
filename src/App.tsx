import { useState, useMemo, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  DollarSign,
  Car,
  Sparkles,
  Plus,
  Settings,
  Download,
  Upload,
  FileDown,
  Sun,
  Moon,
  Target,
  FileText,
} from "lucide-react";
import { useAppData } from "./hooks/useAppData";
import { useGeminiInsights } from "./hooks/useGeminiInsights";
import { computeMonthlySummary, previousMonth, getLastNMonths } from "./lib/calculations";
import { exportEarningsCSV, exportExpensesCSV, exportFiscalReport } from "./lib/export";
import { Dashboard } from "./components/Dashboard";
import { EarningsForm } from "./components/EarningsForm";
import { ExpensesForm } from "./components/ExpensesForm";
import { VehiclePanel } from "./components/VehiclePanel";
import { InsightsPanel } from "./components/InsightsPanel";
import { MonthSelector } from "./components/MonthSelector";
import { QuickAddModal } from "./components/QuickAddModal";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { Card, CardTitle } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";


type Tab = "dashboard" | "financas" | "veiculo" | "insights" | "config";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "financas", label: "Finanças", icon: DollarSign },
  { id: "veiculo", label: "Veículo", icon: Car },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "config", label: "Config", icon: Settings },
];

function AppContent() {
  const {
    data,
    addEarning,
    updateEarning,
    removeEarning,
    restoreEarning,
    addExpense,
    updateExpense,
    removeExpense,
    restoreExpense,
    setVehicle,
    setMaintenanceConfig,
    setGoals,
    toggleTheme,
    exportBackup,
    importBackup,
  } = useAppData();

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(
    () =>
      computeMonthlySummary(
        data.earnings,
        data.expenses,
        data.maintenanceConfig,
        month,
      ),
    [data.earnings, data.expenses, data.maintenanceConfig, month],
  );

  const prevMonth = useMemo(() => previousMonth(month), [month]);

  const prevSummary = useMemo(
    () =>
      computeMonthlySummary(
        data.earnings,
        data.expenses,
        data.maintenanceConfig,
        prevMonth,
      ),
    [data.earnings, data.expenses, data.maintenanceConfig, prevMonth],
  );

  const gemini = useGeminiInsights();

  const handleGeminiGenerate = useCallback(
    (forceRefresh = false) => {
      gemini.generate(
        summary,
        prevSummary.totalEarnings > 0 ? prevSummary : null,
        data.earnings,
        data.expenses,
        data.vehicle,
        forceRefresh,
      );
    },
    [gemini, summary, prevSummary, data.earnings, data.expenses, data.vehicle],
  );

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab as Tab);
  }, []);

  // Goals local state
  const [earningGoal, setEarningGoal] = useState(String(data.goals.earningGoal || ''));
  const [expenseLimit, setExpenseLimit] = useState(String(data.goals.expenseLimit || ''));

  function handleSaveGoals() {
    setGoals({
      earningGoal: Number(earningGoal) || 0,
      expenseLimit: Number(expenseLimit) || 0,
    });
    toast("Metas salvas!", "success");
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await importBackup(file);
    toast(ok ? "Backup restaurado!" : "Arquivo inválido", ok ? "success" : "error");
    e.target.value = '';
  }

  function handleExportFiscal() {
    const months = getLastNMonths(month, 12);
    const summaries = months.map((m) =>
      computeMonthlySummary(data.earnings, data.expenses, data.maintenanceConfig, m),
    ).filter((s) => s.totalEarnings > 0 || s.totalExpenses > 0);
    if (summaries.length === 0) {
      toast("Sem dados para exportar", "error");
      return;
    }
    const period = `${summaries[0].month} a ${summaries[summaries.length - 1].month}`;
    exportFiscalReport(data.earnings, data.expenses, summaries, period);
    toast("Relatório fiscal exportado!", "success");
  }

  return (
    <div className={`flex min-h-screen flex-col ${data.theme === 'light' ? 'bg-gray-50 text-slate-700' : 'bg-slate-950 text-slate-300'}`}>
      {/* ── Header ── */}
      <header className={`sticky top-0 z-30 backdrop-blur-xl border-b ${data.theme === 'light' ? 'bg-white/90 border-gray-200' : 'bg-slate-900/90 border-slate-800/60'}`}>
        <div className="container-app flex items-center justify-between h-16 sm:h-18">
          <h1 className={`text-xl font-extrabold tracking-tight ${data.theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Driver<span className="text-emerald-500">Finance</span>
          </h1>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
                data.theme === 'light' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              aria-label="Alternar tema"
            >
              {data.theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Desktop nav */}
            <nav className={`hidden sm:flex gap-1.5 rounded-2xl p-1.5 border ${data.theme === 'light' ? 'bg-gray-100/80 border-gray-200' : 'bg-slate-800/60 border-slate-700/50'}`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                        : data.theme === 'light'
                          ? "text-gray-500 hover:text-gray-800 hover:bg-gray-200/80"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 container-app py-4 sm:py-6 lg:py-8 pb-24 sm:pb-8">
        <div className="mb-5 sm:mb-6">
          <MonthSelector month={month} onChange={setMonth} />
        </div>

        {activeTab === "dashboard" && (
          <Dashboard
            summary={summary}
            prevSummary={prevSummary}
            goals={data.goals}
            earnings={data.earnings}
            expenses={data.expenses}
            maintenanceConfig={data.maintenanceConfig}
            month={month}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === "financas" && (
          <div className="animate-page grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-2">
            <EarningsForm
              earnings={data.earnings}
              month={month}
              onAdd={(e) => {
                addEarning(e);
                toast("Ganho adicionado!", "success");
              }}
              onUpdate={(id, e) => {
                updateEarning(id, e);
                toast("Ganho atualizado!", "success");
              }}
              onRemove={(id) => {
                const earning = data.earnings.find((e) => e.id === id);
                removeEarning(id);
                toast("Ganho removido", "success", earning ? () => restoreEarning(earning) : undefined);
              }}
            />
            <ExpensesForm
              expenses={data.expenses}
              month={month}
              onAdd={(e) => {
                addExpense(e);
                toast("Gasto adicionado!", "success");
              }}
              onUpdate={(id, e) => {
                updateExpense(id, e);
                toast("Gasto atualizado!", "success");
              }}
              onRemove={(id) => {
                const expense = data.expenses.find((e) => e.id === id);
                removeExpense(id);
                toast("Gasto removido", "success", expense ? () => restoreExpense(expense) : undefined);
              }}
            />
          </div>
        )}

        {activeTab === "veiculo" && (
          <VehiclePanel
            vehicle={data.vehicle}
            config={data.maintenanceConfig}
            totalKm={summary.totalKm}
            totalEarnings={summary.totalEarnings}
            expenses={data.expenses}
            month={month}
            onSaveVehicle={(v) => {
              setVehicle(v);
              toast("Veículo salvo!", "success");
            }}
            onSaveConfig={(c) => {
              setMaintenanceConfig(c);
              toast("Configuração atualizada!", "success");
            }}
          />
        )}

        {activeTab === "insights" && (
          <InsightsPanel
            content={gemini.content}
            loading={gemini.loading}
            error={gemini.error}
            onGenerate={handleGeminiGenerate}
          />
        )}

        {activeTab === "config" && (
          <div className="animate-page grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-2">
            {/* Metas */}
            <Card>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" /> Metas Mensais
                </span>
              </CardTitle>
              <div className="space-y-3">
                <Input id="goal-earning" label="Meta de ganho (R$)" type="number" min="0" step="100" placeholder="8000" value={earningGoal} onChange={(e) => setEarningGoal(e.target.value)} />
                <Input id="goal-expense" label="Limite de gastos (R$)" type="number" min="0" step="100" placeholder="3000" value={expenseLimit} onChange={(e) => setExpenseLimit(e.target.value)} />
                <Button onClick={handleSaveGoals} className="w-full">
                  <Target className="h-4 w-4" /> Salvar Metas
                </Button>
              </div>
            </Card>

            {/* Backup / Restaurar */}
            <Card>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-400" /> Backup & Restauração
                </span>
              </CardTitle>
              <div className="space-y-3">
                <Button onClick={exportBackup} variant="secondary" className="w-full">
                  <Download className="h-4 w-4" /> Exportar Backup (JSON)
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full">
                  <Upload className="h-4 w-4" /> Importar Backup
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportBackup}
                />
              </div>
            </Card>

            {/* Exportar CSV */}
            <Card>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-emerald-400" /> Exportar Dados
                </span>
              </CardTitle>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    exportEarningsCSV(data.earnings, month);
                    toast("CSV de ganhos exportado!", "success");
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <FileDown className="h-4 w-4" /> Ganhos do mês (CSV)
                </Button>
                <Button
                  onClick={() => {
                    exportExpensesCSV(data.expenses, month);
                    toast("CSV de gastos exportado!", "success");
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <FileDown className="h-4 w-4" /> Gastos do mês (CSV)
                </Button>
              </div>
            </Card>

            {/* Relatório Fiscal */}
            <Card>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-400" /> Relatório Fiscal
                </span>
              </CardTitle>
              <p className={`text-sm mb-3 ${data.theme === 'light' ? 'text-gray-500' : 'text-slate-500'}`}>
                Gera um CSV com resumo dos últimos 12 meses para informar ao contador ou para declaração de imposto.
              </p>
              <Button onClick={handleExportFiscal} variant="secondary" className="w-full">
                <FileText className="h-4 w-4" /> Exportar Relatório Fiscal
              </Button>
            </Card>

            {/* Tema */}
            <Card className="lg:col-span-2">
              <CardTitle>
                <span className="flex items-center gap-2">
                  {data.theme === 'light' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-blue-400" />}
                  Aparência
                </span>
              </CardTitle>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className={`flex-1 rounded-xl border p-4 text-center transition-all cursor-pointer ${
                    data.theme === 'dark'
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : data.theme === 'light' ? 'border-gray-300 hover:border-gray-400' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Moon className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                  <p className={`text-sm font-medium ${data.theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Escuro</p>
                </button>
                <button
                  onClick={toggleTheme}
                  className={`flex-1 rounded-xl border p-4 text-center transition-all cursor-pointer ${
                    data.theme === 'light'
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Sun className="h-6 w-6 mx-auto mb-2 text-amber-400" />
                  <p className={`text-sm font-medium ${data.theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Claro</p>
                </button>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* ── FAB ── */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed z-20 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 transition-transform hover:scale-110 active:scale-90 cursor-pointer animate-fab right-5 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:bottom-8 sm:right-8"
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
          toast("Ganho adicionado!", "success");
        }}
        onAddExpense={(e) => {
          addExpense(e);
          toast("Gasto adicionado!", "success");
        }}
      />

      {/* ── Bottom Tab Bar (mobile) ── */}
      <nav className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-around backdrop-blur-xl border-t pt-2 pb-1 sm:hidden safe-bottom ${
        data.theme === 'light' ? 'bg-white/95 border-gray-200' : 'bg-slate-900/95 border-slate-800/60'
      }`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-3 py-2 transition-colors cursor-pointer active:scale-90 ${
                active ? "text-emerald-500" : data.theme === 'light' ? "text-gray-400" : "text-slate-500"
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

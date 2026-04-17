import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import driveFinanceLogo from "./assets/Logo driveFinance.webp";
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
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { useAppDataFirebase } from "./hooks/useAppDataFirebase";
import { useGeminiInsights } from "./hooks/useGeminiInsights";
import { usePushNotifications, useMonthlyGoalNotification } from "./hooks/usePushNotifications";
import { computeMonthlySummary, previousMonth, getLastNMonths } from "./lib/calculations";
import { exportEarningsCSV, exportExpensesCSV, exportFiscalReportCSV, exportConsolidatedCSV } from "./lib/csvExport";
import { Dashboard } from "./components/Dashboard";
import { EarningsForm } from "./components/EarningsForm";
import { ExpensesForm } from "./components/ExpensesForm";
import { VehiclePanel } from "./components/VehiclePanel";
import { InsightsPanel } from "./components/InsightsPanel";
import { MonthSelector } from "./components/MonthSelector";
import { QuickAddModal } from "./components/QuickAddModal";
import { LoginScreen } from "./components/LoginScreen";
import { useToast } from "./components/ui/Toast";
import { Card, CardTitle } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { AchievementsPanel } from "./components/AchievementsPanel";
import { DailyRanking } from "./components/DailyRanking";
import { DailyGoalWidget } from "./components/DailyGoalWidget";
import { FuelCalculator } from "./components/FuelCalculator";
import { ReminderBanner, ReminderSettings } from "./components/Reminders";
import { OnboardingScreen, isOnboardingDone } from "./components/Onboarding";
import { ProfilePage } from "./components/ProfilePage";
import { DESIGN_TOKENS } from "./lib/constants";


type Tab = "dashboard" | "financas" | "veiculo" | "insights" | "config" | "perfil";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "financas", label: "Finanças", icon: DollarSign },
  { id: "veiculo", label: "Veículo", icon: Car },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "config", label: "Config", icon: Settings },
];

function AppContent() {
  const { user } = useAuth();
  const {
    data,
    loading: dataLoading,
    error: dataError,
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
    migrateFromLocalStorage,
  } = useAppDataFirebase();

  // Setup push notifications
  usePushNotifications(user?.uid);

  // Setup monthly goal notification
  const currentMonth = new Date().toISOString().slice(0, 7);
  const earningsThisMonth = useMemo(
    () => data.earnings
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0),
    [data.earnings, currentMonth]
  );
  useMonthlyGoalNotification(earningsThisMonth, data.goals.earningGoal);

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingDone());

  // Goals local state — deve ficar aqui (antes de qualquer early return)
  const [earningGoal, setEarningGoal] = useState('');
  const [expenseLimit, setExpenseLimit] = useState('');

  // Sincroniza goals state quando data carrega
  useEffect(() => {
    setEarningGoal(String(data.goals.earningGoal || ''));
    setExpenseLimit(String(data.goals.expenseLimit || ''));
  }, [data.goals.earningGoal, data.goals.expenseLimit]);

  // Migração automática: localStorage → Firestore (apenas no primeiro login)
  useEffect(() => {
    migrateFromLocalStorage();
  }, [migrateFromLocalStorage]);

  const today = new Date().toISOString().slice(0, 10);
  const hasEarningsToday = data.earnings.some((e) => e.date === today);

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
      gemini.generate({
        summary,
        prevSummary: prevSummary.totalEarnings > 0 ? prevSummary : null,
        earnings: data.earnings,
        expenses: data.expenses,
        vehicle: data.vehicle,
        forceRefresh,
      });
    },
    [gemini, summary, prevSummary, data.earnings, data.expenses, data.vehicle],
  );

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab as Tab);
  }, []);

  // ── Early returns (depois de TODOS os hooks) ──

  if (dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-slate-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Erro ao carregar dados</h2>
          <p className="mb-6 text-sm text-slate-400">{dataError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

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
    const ok = exportFiscalReportCSV(data.earnings, data.expenses, summaries, period);
    if (ok) toast("Relatório fiscal exportado em CSV!", "success");
    else toast("Erro ao exportar arquivo", "error");
  }

  return (
    <>
    {showOnboarding && <OnboardingScreen onComplete={() => setShowOnboarding(false)} />}
    <div className={`flex min-h-screen flex-col ${data.theme === 'light' ? 'bg-gray-50 text-slate-700' : 'bg-slate-950 text-slate-300'}`}>
      <header className={`sticky top-0 z-30 backdrop-blur-xl border-b ${data.theme === 'light' ? 'bg-white/90 border-gray-200' : 'bg-slate-900/90 border-slate-800/60'}`}>
        <div className={`container-app flex items-center justify-between ${DESIGN_TOKENS.heights.header.mobile} sm:${DESIGN_TOKENS.heights.header.desktop} px-2 sm:px-4`}>
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={driveFinanceLogo}
              alt="Logo driveFinance"
              className="h-10 sm:h-12 object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center gap-1.5 rounded-2xl p-1.5 border backdrop-blur-sm ${
            data.theme === 'light'
              ? 'border-gray-200/80 bg-white/60'
              : 'border-slate-700/50 bg-slate-800/60'
          }`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all cursor-pointer min-h-[44px] ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle - visible on all screens */}
            <button
              onClick={toggleTheme}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[44px] ${
                data.theme === 'light'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              aria-label="Alternar tema"
            >
              {data.theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* User avatar */}
            <button
              onClick={() => setActiveTab("perfil")}
              className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all cursor-pointer min-h-[44px] ${
                activeTab === "perfil"
                  ? "bg-emerald-600/20 ring-1 ring-emerald-500/50"
                  : data.theme === 'light'
                    ? 'hover:bg-gray-100'
                    : 'hover:bg-slate-800'
              }`}
              title="Meu Perfil"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full border-2 border-emerald-500/50 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {(user?.displayName || user?.email || '?')[0].toUpperCase()}
                </div>
              )}
              <span className={`hidden xl:block text-sm font-medium truncate max-w-[140px] ${
                data.theme === 'light' ? 'text-gray-700' : 'text-slate-300'
              }`}>
                Olá, {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 container-app py-3 sm:py-4 md:py-6 lg:py-8 pb-20 sm:pb-16 md:pb-12">
        <div className="mb-4 sm:mb-5 md:mb-6">
          <MonthSelector month={month} onChange={setMonth} />
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-4 sm:space-y-5">
            <ReminderBanner hasEarningsToday={hasEarningsToday} theme={data.theme} />
            <DailyGoalWidget
              earnings={data.earnings}
              goals={data.goals}
              theme={data.theme}
            />
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
            <DailyRanking
              earnings={data.earnings}
              summary={summary}
              goals={data.goals}
              month={month}
              theme={data.theme}
            />
            <AchievementsPanel
              earnings={data.earnings}
              expenses={data.expenses}
              summary={summary}
              theme={data.theme}
            />
          </div>
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
          <div className="animate-page space-y-4 sm:space-y-5">
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
            <FuelCalculator theme={data.theme} />
          </div>
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
                    const ok = exportEarningsCSV(data.earnings, month);
                    if (ok) toast("Ganhos exportados em CSV!", "success");
                    else toast("Nenhum dado para exportar", "error");
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <FileDown className="h-4 w-4" /> Ganhos do mês (CSV)
                </Button>
                <Button
                  onClick={() => {
                    const ok = exportExpensesCSV(data.expenses, month);
                    if (ok) toast("Gastos exportados em CSV!", "success");
                    else toast("Nenhum dado para exportar", "error");
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <FileDown className="h-4 w-4" /> Gastos do mês (CSV)
                </Button>
                <Button
                  onClick={() => {
                    const ok = exportConsolidatedCSV(data.earnings, data.expenses, month);
                    if (ok) toast("Relatório consolidado exportado!", "success");
                    else toast("Nenhum dado para exportar", "error");
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <FileDown className="h-4 w-4" /> Consolidado (CSV)
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
                <FileText className="h-4 w-4" /> Exportar Relatório Fiscal (CSV)
              </Button>
            </Card>

            {/* Lembretes */}
            <ReminderSettings theme={data.theme} />

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

        {activeTab === "perfil" && (
          <ProfilePage
            theme={data.theme}
            onBack={() => setActiveTab("dashboard")}
          />
        )}
      </main>

      {/* ── FAB ── */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 transition-transform hover:scale-110 active:scale-90 cursor-pointer animate-fab right-4 bottom-20 sm:bottom-6 sm:right-6 md:h-16 md:w-16"
        aria-label="Adicionar rápido"
      >
        <Plus className="h-6 w-6 md:h-7 md:w-7" />
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
              className={`relative flex flex-col items-center gap-1 px-2 py-3 transition-colors cursor-pointer active:scale-90 min-h-[60px] min-w-[60px] rounded-lg ${
                active ? "text-emerald-500" : data.theme === 'light' ? "text-gray-400" : "text-slate-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              {active && (
                <span className="absolute -top-1 h-0.5 w-8 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
        {/* Perfil na bottom bar */}
        <button
          onClick={() => setActiveTab("perfil")}
          className={`relative flex flex-col items-center gap-1 px-2 py-3 transition-colors cursor-pointer active:scale-90 min-h-[60px] min-w-[60px] rounded-lg ${
            activeTab === "perfil" ? "text-emerald-500" : data.theme === 'light' ? "text-gray-400" : "text-slate-500"
          }`}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="h-5 w-5 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="h-5 w-5" />
          )}
          <span className="text-[10px] font-medium leading-tight">Perfil</span>
          {activeTab === "perfil" && (
            <span className="absolute -top-1 h-0.5 w-8 rounded-full bg-emerald-400" />
          )}
        </button>
      </nav>
    {/* ── Wordmark rodapé ── */}

    {/* ── Footer ── */}
    <footer className={`mt-auto border-t ${data.theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900 border-slate-800'}`}>
      <div className="container-app py-4 sm:py-6 md:py-8">
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
          <img
            src={driveFinanceLogo}
            alt="Logo driveFinance"
            className="h-8 w-auto sm:h-10 md:h-12 object-contain"
          />
          <div className="flex flex-col items-center space-y-1 sm:space-y-2 text-center">
            <p className={`text-sm sm:text-base font-medium ${data.theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>
              driveFinance
            </p>
            <p className={`text-xs sm:text-sm ${data.theme === 'light' ? 'text-gray-500' : 'text-slate-500'} max-w-xs`}>
              Controle financeiro para motoristas
            </p>
          </div>
          <div className="flex items-center">
            <span className={`text-xs sm:text-sm ${data.theme === 'light' ? 'text-gray-400' : 'text-slate-600'}`}>
              © 2024 driveFinance. Todos os direitos reservados.
            </span>
          </div>
        </div>
      </div>
    </footer>
    </div>
    </>
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <AppContent />;
}

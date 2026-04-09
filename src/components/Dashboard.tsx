import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,

  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Wallet,
  ShieldCheck,
  BarChart3,
  PieChartIcon,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Fuel,
} from 'lucide-react';
import type { MonthlySummary, GoalConfig, Earning, Expense, MaintenanceReserveConfig } from '../types';
import { Card, CardTitle } from './ui/Card';
import { KpiCard } from './ui/KpiCard';
import { currency } from '../lib/utils';
import { percentChange, getLastNMonths, computeMonthlySummary, computeWeeklySummaries, computeFuelMonthlySummary } from '../lib/calculations';

interface Props {
  summary: MonthlySummary;
  prevSummary: MonthlySummary;
  goals: GoalConfig;
  earnings: Earning[];
  expenses: Expense[];
  maintenanceConfig: MaintenanceReserveConfig;
  month: string;
  onNavigate: (tab: string) => void;
}

const PIE_COLORS = ['#34d399', '#fb7185', '#fbbf24', '#60a5fa', '#a78bfa'];

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
};

type ChartView = 'bars' | 'pie';

function ChangeIndicator({ value }: { value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

function GoalBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  if (goal <= 0) return null;
  const pct = Math.min((current / goal) * 100, 100);
  const reached = current >= goal;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${reached ? 'text-emerald-400' : 'text-slate-300'}`}>
          {currency(current)} / {currency(goal)}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function Dashboard({ summary, prevSummary, goals, earnings, expenses, maintenanceConfig, month, onNavigate }: Props) {
  const [chartView, setChartView] = useState<ChartView>('bars');

  const hasData = summary.totalEarnings > 0 || summary.totalExpenses > 0;

  // Evolução 6 meses
  const evolutionData = useMemo(() => {
    const months = getLastNMonths(month, 6);
    return months.map((m) => {
      const s = computeMonthlySummary(earnings, expenses, maintenanceConfig, m);
      const label = m.slice(5); // MM
      return { month: label, Ganhos: s.totalEarnings, Gastos: s.totalExpenses, Lucro: s.netProfit };
    });
  }, [month, earnings, expenses, maintenanceConfig]);

  // Resumo semanal
  const weeklySummaries = useMemo(
    () => computeWeeklySummaries(earnings, expenses, month),
    [earnings, expenses, month],
  );

  // Resumo mensal de combustível (usa reduce)
  const fuelSummary = useMemo(
    () => computeFuelMonthlySummary(earnings, expenses, month),
    [earnings, expenses, month],
  );

  // Variações %
  const earningsChange = percentChange(summary.totalEarnings, prevSummary.totalEarnings);
  const expensesChange = percentChange(summary.totalExpenses, prevSummary.totalExpenses);
  const profitChange = percentChange(summary.netProfit, prevSummary.netProfit);

  const overviewChart = [
    { name: 'Ganhos', valor: summary.totalEarnings, fill: '#34d399' },
    { name: 'Gastos', valor: summary.totalExpenses, fill: '#fb7185' },
    { name: 'Reserva', valor: summary.maintenanceReserve, fill: '#fbbf24' },
    { name: 'Lucro', valor: Math.max(0, summary.netProfit), fill: '#60a5fa' },
  ];

  const platformChart = [
    { name: 'Uber', valor: summary.earningsByPlatform.uber },
    { name: '99', valor: summary.earningsByPlatform['99'] },
    { name: 'Outros', valor: summary.earningsByPlatform.outros },
  ].filter((p) => p.valor > 0);

  const expenseChart = [
    { name: 'Combustível', valor: summary.expensesByCategory.combustivel },
    { name: 'Alimentação', valor: summary.expensesByCategory.alimentacao },
    { name: 'Taxas', valor: summary.expensesByCategory.taxas },
    { name: 'Lavagem', valor: summary.expensesByCategory.lavagem },
    { name: 'Outros', valor: summary.expensesByCategory.outros },
  ].filter((c) => c.valor > 0);

  const hasGoals = goals.earningGoal > 0 || goals.expenseLimit > 0;

  if (!hasData) {
    return (
      <div className="animate-page flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800">
          <BarChart3 className="h-10 w-10 text-slate-600" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">Nenhum dado ainda</h2>
        <p className="mb-6 max-w-xs text-sm text-slate-500">
          Registre seus ganhos e gastos para ver o dashboard.
        </p>
        <button
          onClick={() => onNavigate('financas')}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-95 cursor-pointer transition-colors"
        >
          Começar a registrar
        </button>
      </div>
    );
  }

  return (
    <div className="animate-page flex flex-col gap-5 sm:gap-6 lg:gap-8">
      {/* ── KPIs principais com comparação ── */}
      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
          <KpiCard
            title="Ganho Bruto"
            value={currency(summary.totalEarnings)}
            icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="emerald"
            onClick={() => onNavigate('financas')}
            extra={<ChangeIndicator value={earningsChange} />}
          />
          <KpiCard
            title="Total Gastos"
            value={currency(summary.totalExpenses)}
            icon={<TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="red"
            onClick={() => onNavigate('financas')}
            extra={expensesChange !== null ? <ChangeIndicator value={-expensesChange} /> : null}
          />
          <KpiCard
            title="Lucro Líquido"
            value={currency(summary.netProfit)}
            icon={<Wallet className="h-5 w-5 sm:h-6 sm:w-6" />}
            color={summary.netProfit >= 0 ? 'emerald' : 'red'}
            extra={<ChangeIndicator value={profitChange} />}
          />
        </div>
      </section>

      {/* ── KPIs secundários ── */}
      <section>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-5">
          <KpiCard
            title="Reserva"
            value={currency(summary.maintenanceReserve)}
            icon={<ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="amber"
            compact
            onClick={() => onNavigate('veiculo')}
          />
          <KpiCard
            title="R$/Hora"
            value={currency(summary.earningsPerHour)}
            icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="blue"
            compact
          />
          <KpiCard
            title="R$/KM"
            value={currency(summary.earningsPerKm)}
            icon={<MapPin className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="blue"
            compact
          />
        </div>
      </section>

      {/* ── Metas ── */}
      {hasGoals && (
        <section>
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" /> Metas do Mês
              </span>
            </CardTitle>
            <div className="space-y-3">
              <GoalBar label="Meta de Ganho" current={summary.totalEarnings} goal={goals.earningGoal} color="#34d399" />
              <GoalBar label="Limite de Gasto" current={summary.totalExpenses} goal={goals.expenseLimit} color="#fb7185" />
            </div>
          </Card>
        </section>
      )}

      {/* ── Evolução mensal (últimos 6 meses) ── */}
      <section>
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" /> Evolução (6 meses)
            </span>
          </CardTitle>
          <div className="h-52 sm:h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="gradGanhos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} width={55} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => currency(Number(val))} />
                <Area type="monotone" dataKey="Ganhos" stroke="#34d399" fill="url(#gradGanhos)" strokeWidth={2} />
                <Area type="monotone" dataKey="Lucro" stroke="#60a5fa" fill="url(#gradLucro)" strokeWidth={2} />
                <Line type="monotone" dataKey="Gastos" stroke="#fb7185" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* ── Resumo Semanal ── */}
      {weeklySummaries.some((w) => w.earnings > 0 || w.expenses > 0) && (
        <section>
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-400" /> Resumo Semanal
              </span>
            </CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400">
                    <th className="pb-2 text-left font-medium">Semana</th>
                    <th className="pb-2 text-right font-medium">Ganhos</th>
                    <th className="pb-2 text-right font-medium">Gastos</th>
                    <th className="pb-2 text-right font-medium">Lucro</th>
                    <th className="pb-2 text-right font-medium hidden sm:table-cell">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklySummaries.map((w) => (
                    <tr key={w.week} className="border-b border-slate-800/50">
                      <td className="py-2 text-slate-300 font-medium">{w.label}</td>
                      <td className="py-2 text-right text-emerald-400">{currency(w.earnings)}</td>
                      <td className="py-2 text-right text-red-400">{currency(w.expenses)}</td>
                      <td className={`py-2 text-right font-semibold ${w.profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{currency(w.profit)}</td>
                      <td className="py-2 text-right text-slate-500 hidden sm:table-cell">{w.hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {/* ── Resumo Mensal de Combustível ── */}
      {fuelSummary.totalFuelExpense > 0 && (
        <section>
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-amber-400" /> Combustível do Mês
              </span>
            </CardTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-[10px] text-amber-400/70 uppercase tracking-wide font-medium mb-1">Gasto Total</p>
                <p className="text-sm sm:text-base font-bold text-amber-300">{currency(fuelSummary.totalFuelExpense)}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                <p className="text-[10px] text-blue-400/70 uppercase tracking-wide font-medium mb-1">KM Rodados</p>
                <p className="text-sm sm:text-base font-bold text-blue-300">{fuelSummary.totalKm.toLocaleString('pt-BR')} km</p>
              </div>
              {fuelSummary.avgPricePerLiter > 0 && (
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-center">
                  <p className="text-[10px] text-purple-400/70 uppercase tracking-wide font-medium mb-1">Preço Médio/L</p>
                  <p className="text-sm sm:text-base font-bold text-purple-300">R$ {fuelSummary.avgPricePerLiter.toFixed(2)}</p>
                </div>
              )}
              {fuelSummary.costPerKm > 0 && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
                  <p className="text-[10px] text-red-400/70 uppercase tracking-wide font-medium mb-1">Custo/KM</p>
                  <p className="text-sm sm:text-base font-bold text-red-300">R$ {fuelSummary.costPerKm.toFixed(2)}</p>
                </div>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* ── Toggle gráficos ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-white">Visão Geral</h3>
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/50">
            <button
              onClick={() => setChartView('bars')}
              className={`rounded-lg p-2 sm:p-2.5 transition-colors cursor-pointer ${chartView === 'bars' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              aria-label="Barras"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartView('pie')}
              className={`rounded-lg p-2 sm:p-2.5 transition-colors cursor-pointer ${chartView === 'pie' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              aria-label="Pizza"
            >
              <PieChartIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {chartView === 'bars' ? (
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Card>
              <CardTitle>Ganhos vs Gastos</CardTitle>
              <div className="h-52 sm:h-64 lg:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewChart} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} width={55} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#cbd5e1' }}
                      formatter={(value) => currency(Number(value))}
                      cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                    />
                    <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                      {overviewChart.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardTitle>Ganhos por Plataforma</CardTitle>
              <div className="h-52 sm:h-64 lg:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformChart} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} width={55} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#cbd5e1' }}
                      formatter={(value) => currency(Number(value))}
                      cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12, paddingTop: '8px' }} />
                    <Bar dataKey="valor" fill="#34d399" name="Ganhos" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Card>
              <CardTitle>Receita por Plataforma</CardTitle>
              <div className="h-52 sm:h-64 lg:h-72">
                {platformChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformChart}
                        dataKey="valor"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="75%"
                        innerRadius="45%"
                        paddingAngle={4}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {platformChart.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => currency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-slate-600">Sem dados</p>
                )}
              </div>
            </Card>

            <Card>
              <CardTitle>Gastos por Categoria</CardTitle>
              <div className="h-52 sm:h-64 lg:h-72">
                {expenseChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChart}
                        dataKey="valor"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="75%"
                        innerRadius="45%"
                        paddingAngle={4}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {expenseChart.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => currency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-slate-600">Sem dados</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* ── Detalhamento de Gastos ── */}
      {expenseChart.length > 0 && (
        <section>
          <Card>
            <CardTitle>Detalhamento de Gastos</CardTitle>
            <div className="space-y-4">
              {expenseChart.map((item, i) => {
                const pct = summary.totalExpenses > 0 ? (item.valor / summary.totalExpenses) * 100 : 0;
                return (
                  <div key={item.name}>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">{item.name}</span>
                      <span className="text-sm font-bold text-white">
                        {currency(item.valor)}{' '}
                        <span className="text-slate-500 font-normal text-xs ml-1">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800/80 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

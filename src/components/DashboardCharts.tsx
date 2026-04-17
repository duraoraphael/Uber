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
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Wallet,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Fuel,
} from 'lucide-react';
import type { MonthlySummary, GoalConfig, Earning, Expense, MaintenanceReserveConfig } from '../types';
import { Card, CardTitle } from './ui/Card';
import { KpiCard } from './ui/KpiCard';
import { currency } from '../lib/utils';
import { percentChange, getLastNMonths, computeMonthlySummary } from '../lib/calculations';
import { CHART_COLORS } from '../lib/constants';

interface Props {
  summary: MonthlySummary;
  prevSummary: MonthlySummary;
  goals?: GoalConfig;
  earnings: Earning[];
  expenses: Expense[];
  maintenanceConfig: MaintenanceReserveConfig;
  month: string;
  theme: string;
}

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

export default function DashboardCharts({ summary, prevSummary, goals, earnings, expenses, maintenanceConfig, month, theme }: Props) {
  const [chartView, setChartView] = useState<ChartView>('bars');

  const evolutionData = useMemo(() => {
    const months = getLastNMonths(month, 6);
    return months.map((m) => {
      const s = computeMonthlySummary(earnings, expenses, maintenanceConfig, m);
      const label = m.slice(5); // MM
      return { month: label, Ganhos: s.totalEarnings, Gastos: s.totalExpenses, Lucro: s.netProfit };
    });
  }, [month, earnings, expenses, maintenanceConfig]);

  // Variações %
  const earningsChange = percentChange(summary.totalEarnings, prevSummary.totalEarnings);
  const expensesChange = percentChange(summary.totalExpenses, prevSummary.totalExpenses);
  const profitChange = percentChange(summary.netProfit, prevSummary.netProfit);

  const overviewChart = [
    { name: 'Ganhos', valor: summary.totalEarnings, fill: CHART_COLORS[0] },
    { name: 'Gastos', valor: summary.totalExpenses, fill: CHART_COLORS[1] },
    { name: 'Reserva', valor: summary.maintenanceReserve, fill: CHART_COLORS[2] },
    { name: 'Lucro', valor: Math.max(0, summary.netProfit), fill: CHART_COLORS[3] },
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

  const hasGoals = goals && (goals.earningGoal > 0 || goals.expenseLimit > 0);

  return (
    <>
      {/* ── KPIs principais com comparação ── */}
      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
          <KpiCard
            title="Ganho Bruto"
            value={currency(summary.totalEarnings)}
            icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="emerald"
            onClick={() => {}}
            extra={<ChangeIndicator value={earningsChange} />}
          />
          <KpiCard
            title="Total Gastos"
            value={currency(summary.totalExpenses)}
            icon={<TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="red"
            onClick={() => {}}
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

      {/* ── Gráficos ── */}
      <section className="grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-2">
        {/* Visão geral */}
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" /> Visão Geral
            </span>
          </CardTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'bars' ? (
                <BarChart data={overviewChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [value ? currency(Number(value)) : 'R$ 0,00', '']}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={overviewChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="valor"
                  >
                    {overviewChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value ? currency(Number(value)) : 'R$ 0,00', '']}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setChartView('bars')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                chartView === 'bars'
                  ? 'bg-emerald-600 text-white'
                  : theme === 'light'
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Barras
            </button>
            <button
              onClick={() => setChartView('pie')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                chartView === 'pie'
                  ? 'bg-emerald-600 text-white'
                  : theme === 'light'
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Pizza
            </button>
          </div>
        </Card>

        {/* Evolução mensal */}
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" /> Evolução (6 meses)
            </span>
          </CardTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  formatter={(value, name) => [value ? currency(Number(value)) : 'R$ 0,00', name || '']}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Area
                  type="monotone"
                  dataKey="Ganhos"
                  stackId="1"
                  stroke={CHART_COLORS[0]}
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="Gastos"
                  stackId="2"
                  stroke={CHART_COLORS[1]}
                  fill={CHART_COLORS[1]}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Por plataforma */}
        {platformChart.length > 0 && (
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-400" /> Por Plataforma
              </span>
            </CardTitle>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="valor"
                  >
                    {platformChart.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value ? currency(Number(value)) : 'R$ 0,00', '']}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Por categoria de gasto */}
        {expenseChart.length > 0 && (
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-orange-400" /> Gastos por Categoria
              </span>
            </CardTitle>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseChart} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={80} />
                  <Tooltip
                    formatter={(value) => [value ? currency(Number(value)) : 'R$ 0,00', '']}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} fill={CHART_COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Metas */}
        {hasGoals && (
          <Card className="lg:col-span-2">
            <CardTitle>
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" /> Progresso das Metas
              </span>
            </CardTitle>
            <div className="space-y-4">
              <GoalBar
                label="Meta de Ganho"
                current={summary.totalEarnings}
                goal={goals.earningGoal}
                color="#34d399"
              />
              <GoalBar
                label="Limite de Gastos"
                current={summary.totalExpenses}
                goal={goals.expenseLimit}
                color="#fb7185"
              />
            </div>
          </Card>
        )}
      </section>
    </>
  );
}
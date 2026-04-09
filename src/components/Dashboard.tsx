import { useState } from 'react';
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
} from 'lucide-react';
import type { MonthlySummary } from '../types';
import { Card, CardTitle } from './ui/Card';
import { KpiCard } from './ui/KpiCard';
import { currency } from '../lib/utils';

interface Props {
  summary: MonthlySummary;
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

export function Dashboard({ summary, onNavigate }: Props) {
  const [chartView, setChartView] = useState<ChartView>('bars');

  const hasData = summary.totalEarnings > 0 || summary.totalExpenses > 0;

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
    <div className="animate-page space-y-5 sm:space-y-7">
      {/* ── KPIs principais ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <KpiCard
          title="Ganho Bruto"
          value={currency(summary.totalEarnings)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="emerald"
          onClick={() => onNavigate('financas')}
        />
        <KpiCard
          title="Total Gastos"
          value={currency(summary.totalExpenses)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="red"
          onClick={() => onNavigate('financas')}
        />
        <KpiCard
          title="Lucro Líquido"
          value={currency(summary.netProfit)}
          icon={<Wallet className="h-5 w-5" />}
          color={summary.netProfit >= 0 ? 'emerald' : 'red'}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* ── KPIs secundários ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <KpiCard
          title="Reserva"
          value={currency(summary.maintenanceReserve)}
          icon={<ShieldCheck className="h-4 w-4" />}
          color="amber"
          compact
          onClick={() => onNavigate('veiculo')}
        />
        <KpiCard
          title="R$/Hora"
          value={currency(summary.earningsPerHour)}
          icon={<Clock className="h-4 w-4" />}
          color="blue"
          compact
        />
        <KpiCard
          title="R$/KM"
          value={currency(summary.earningsPerKm)}
          icon={<MapPin className="h-4 w-4" />}
          color="blue"
          compact
        />
      </div>

      {/* ── Toggle gráficos ── */}
      <div className="flex items-center justify-between pt-1 sm:pt-2">
        <h3 className="text-base font-semibold text-slate-100">Visão Geral</h3>
        <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700/50">
          <button
            onClick={() => setChartView('bars')}
            className={`rounded-md p-1.5 transition-colors cursor-pointer ${chartView === 'bars' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            aria-label="Barras"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setChartView('pie')}
            className={`rounded-md p-1.5 transition-colors cursor-pointer ${chartView === 'pie' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            aria-label="Pizza"
          >
            <PieChartIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Gráficos ── */}
      {chartView === 'bars' ? (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <Card>
            <CardTitle>Ganhos vs Gastos</CardTitle>
            <div className="h-48 sm:h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewChart} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={45} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: '#cbd5e1' }}
                    formatter={(value) => currency(Number(value))}
                    cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
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
            <div className="h-48 sm:h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformChart} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={45} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: '#cbd5e1' }}
                    formatter={(value) => currency(Number(value))}
                    cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Bar dataKey="valor" fill="#34d399" name="Ganhos" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <Card>
            <CardTitle>Receita por Plataforma</CardTitle>
            <div className="h-48 sm:h-56 lg:h-64">
              {platformChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformChart}
                      dataKey="valor"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      innerRadius="40%"
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
            <div className="h-48 sm:h-56 lg:h-64">
              {expenseChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseChart}
                      dataKey="valor"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      innerRadius="40%"
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

      {/* ── Detalhamento de Gastos ── */}
      {expenseChart.length > 0 && (
        <Card>
          <CardTitle>Detalhamento de Gastos</CardTitle>
          <div className="space-y-4">
            {expenseChart.map((item, i) => {
              const pct = summary.totalExpenses > 0 ? (item.valor / summary.totalExpenses) * 100 : 0;
              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="font-semibold text-slate-100">
                      {currency(item.valor)}{' '}
                      <span className="text-slate-500 font-normal text-xs">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800">
                    <div
                      className="h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

import { lazy, Suspense } from 'react';
import { BarChart3 } from 'lucide-react';

// Lazy load chart components
const LazyDashboardCharts = lazy(() => import('../components/DashboardCharts'));

interface DashboardChartsWrapperProps {
  summary: any;
  prevSummary: any;
  earnings: any[];
  expenses: any[];
  maintenanceConfig: any;
  month: string;
  theme: string;
}

export function DashboardChartsWrapper(props: DashboardChartsWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-slate-400 animate-pulse" />
            <p className="text-sm text-slate-500">Carregando gráficos...</p>
          </div>
        </div>
      }
    >
      <LazyDashboardCharts {...props} />
    </Suspense>
  );
}
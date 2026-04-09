// ============================================================
// Tipos centrais do DriverFinance MVP
// ============================================================

/** Plataformas de corrida suportadas */
export type Platform = 'uber' | '99' | 'outros';

/** Categorias de gasto */
export type ExpenseCategory = 'combustivel' | 'alimentacao' | 'taxas' | 'lavagem' | 'outros';

/** Registro de ganho em uma plataforma */
export interface Earning {
  id: string;
  date: string;            // ISO date (YYYY-MM-DD)
  platform: Platform;
  amount: number;           // valor bruto em R$
  hours: number;            // horas trabalhadas
  km: number;               // quilômetros rodados
}

/** Registro de gasto */
export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
}

/** Dados do veículo do motorista */
export interface Vehicle {
  model: string;
  year: number;
  currentKm: number;
  fuelType: 'gasolina' | 'etanol' | 'flex' | 'gnv';
}

/**
 * Configuração da reserva de manutenção.
 *
 * LÓGICA DE CÁLCULO:
 * - Por KM rodado: multiplica o total de KM do mês pelo valor reservado por KM.
 *   Exemplo: 3.000 km * R$ 0,12/km = R$ 360,00
 * - Por faturamento: aplica a porcentagem sobre o bruto mensal.
 *   Exemplo: R$ 8.000 bruto * 7% = R$ 560,00
 *
 * O sistema sugere entre 5% e 10% do bruto ou R$ 0,08–0,15 por KM,
 * cobrindo: troca de óleo (~R$ 200 a cada 5.000 km), pneus (~R$ 1.200
 * a cada 40.000 km), revisão geral (~R$ 800 a cada 10.000 km), e
 * imprevistos (freios, suspensão, etc.).
 */
export interface MaintenanceReserveConfig {
  method: 'per_km' | 'per_revenue';
  valuePerKm: number;       // R$ por KM (usado se method = 'per_km')
  revenuePercent: number;    // % do bruto (usado se method = 'per_revenue')
}

/** Resumo mensal calculado */
export interface MonthlySummary {
  month: string;             // YYYY-MM
  totalEarnings: number;
  earningsByPlatform: Record<Platform, number>;
  totalExpenses: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  maintenanceReserve: number;
  netProfit: number;         // lucro líquido = ganhos - gastos - reserva
  totalHours: number;
  totalKm: number;
  earningsPerHour: number;
  earningsPerKm: number;
}

/** Insight gerado pela IA */
export interface AIInsight {
  id: string;
  type: 'warning' | 'tip' | 'positive';
  message: string;
  createdAt: string;
}

/** Estado global persistido */
export interface AppData {
  earnings: Earning[];
  expenses: Expense[];
  vehicle: Vehicle | null;
  maintenanceConfig: MaintenanceReserveConfig;
}

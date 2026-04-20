// ============================================================
// Tipos centrais do DriverFinance MVP
// ============================================================

/** Plataformas de corrida suportadas */
export type Platform = 'uber' | '99' | 'outros';

/** Categorias de gasto */
export type ExpenseCategory = 'combustivel' | 'alimentacao' | 'taxas' | 'lavagem' | 'outros';

/** Turno de trabalho */
export type Shift = 'morning' | 'afternoon' | 'night';

/** Registro de ganho em uma plataforma */
export interface Earning {
  id: string;
  date: string;            // ISO date (YYYY-MM-DD)
  platform: Platform;
  amount: number;           // valor bruto em R$
  hours: number;            // horas trabalhadas
  km: number;               // quilômetros rodados
  shift?: Shift;            // turno (opcional, retrocompatível)
}

/** Registro de gasto */
export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  /** Preço por litro de combustível (só para category === 'combustivel') */
  pricePerLiter?: number;
  /** Litros abastecidos (calculado automaticamente: amount / pricePerLiter) */
  liters?: number;
}

/** Dados do veículo do motorista */
export interface Vehicle {
  model: string;
  year: number;
  currentKm: number;
  fuelType: 'gasolina' | 'etanol' | 'flex' | 'gnv';
  /** Consumo médio em km/l (opcional, usado no cálculo de combustível) */
  avgKmPerLiter?: number;
}

/**
 * Configuração da reserva de manutenção.
 */
export interface MaintenanceReserveConfig {
  method: 'per_km' | 'per_revenue';
  valuePerKm: number;
  revenuePercent: number;
}

/** Metas financeiras do motorista */
export interface GoalConfig {
  earningGoal: number;      // Meta de ganho mensal em R$
  expenseLimit: number;     // Limite de gasto mensal em R$
}

/** Tema do app */
export type Theme = 'dark' | 'light';

/** Resumo mensal calculado */
export interface MonthlySummary {
  month: string;
  totalEarnings: number;
  earningsByPlatform: Record<Platform, number>;
  totalExpenses: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  maintenanceReserve: number;
  netProfit: number;
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
  goals: GoalConfig;
  theme: Theme;
}

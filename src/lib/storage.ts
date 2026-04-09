// ============================================================
// Camada de persistência – localStorage
// Estruturada de forma modular para substituição futura
// por Firebase, Supabase ou qualquer backend.
// ============================================================

import type { AppData } from '../types';

const STORAGE_KEY = 'driverfinance_data';

const defaultData: AppData = {
  earnings: [],
  expenses: [],
  vehicle: null,
  maintenanceConfig: {
    method: 'per_revenue',
    valuePerKm: 0.12,
    revenuePercent: 7,
  },
};

/**
 * Interface do repositório de dados.
 * Para migrar para Firebase/Supabase, basta criar outra implementação
 * que respeite esta interface.
 */
export interface DataRepository {
  load(): AppData;
  save(data: AppData): void;
}

/** Implementação com localStorage */
class LocalStorageRepository implements DataRepository {
  load(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultData };
      const parsed = JSON.parse(raw) as Partial<AppData>;
      return {
        earnings: parsed.earnings ?? [],
        expenses: parsed.expenses ?? [],
        vehicle: parsed.vehicle ?? null,
        maintenanceConfig: parsed.maintenanceConfig ?? defaultData.maintenanceConfig,
      };
    } catch {
      return { ...defaultData };
    }
  }

  save(data: AppData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

// Exporta instância singleton – troque aqui para outra implementação
export const repository: DataRepository = new LocalStorageRepository();

// ============================================================
// Hook central de estado – gerencia dados e persiste no storage
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import type { AppData, Earning, Expense, Vehicle, MaintenanceReserveConfig } from '../types';
import { repository } from '../lib/storage';
import { generateId } from '../lib/utils';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => repository.load());

  // Persiste sempre que o estado muda
  useEffect(() => {
    repository.save(data);
  }, [data]);

  // --- Earnings ---
  const addEarning = useCallback((earning: Omit<Earning, 'id'>) => {
    setData((prev) => ({
      ...prev,
      earnings: [...prev.earnings, { ...earning, id: generateId() }],
    }));
  }, []);

  const removeEarning = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      earnings: prev.earnings.filter((e) => e.id !== id),
    }));
  }, []);

  // --- Expenses ---
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { ...expense, id: generateId() }],
    }));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  }, []);

  // --- Vehicle ---
  const setVehicle = useCallback((vehicle: Vehicle) => {
    setData((prev) => ({ ...prev, vehicle }));
  }, []);

  // --- Maintenance Config ---
  const setMaintenanceConfig = useCallback((config: MaintenanceReserveConfig) => {
    setData((prev) => ({ ...prev, maintenanceConfig: config }));
  }, []);

  return {
    data,
    addEarning,
    removeEarning,
    addExpense,
    removeExpense,
    setVehicle,
    setMaintenanceConfig,
  };
}

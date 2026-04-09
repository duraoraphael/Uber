// ============================================================
// Hook central de estado – gerencia dados e persiste no storage
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import type { AppData, Earning, Expense, Vehicle, MaintenanceReserveConfig, GoalConfig, Theme } from '../types';
import { repository } from '../lib/storage';
import { generateId } from '../lib/utils';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => repository.load());

  // Persiste sempre que o estado muda
  useEffect(() => {
    repository.save(data);
  }, [data]);

  // Aplica tema no document
  useEffect(() => {
    document.documentElement.classList.toggle('light', data.theme === 'light');
  }, [data.theme]);

  // --- Earnings ---
  const addEarning = useCallback((earning: Omit<Earning, 'id'>) => {
    setData((prev) => ({
      ...prev,
      earnings: [...prev.earnings, { ...earning, id: generateId() }],
    }));
  }, []);

  const updateEarning = useCallback((id: string, earning: Omit<Earning, 'id'>) => {
    setData((prev) => ({
      ...prev,
      earnings: prev.earnings.map((e) => (e.id === id ? { ...earning, id } : e)),
    }));
  }, []);

  const removeEarning = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      earnings: prev.earnings.filter((e) => e.id !== id),
    }));
  }, []);

  const restoreEarning = useCallback((earning: Earning) => {
    setData((prev) => ({
      ...prev,
      earnings: [...prev.earnings, earning],
    }));
  }, []);

  // --- Expenses ---
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { ...expense, id: generateId() }],
    }));
  }, []);

  const updateExpense = useCallback((id: string, expense: Omit<Expense, 'id'>) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...expense, id } : e)),
    }));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  }, []);

  const restoreExpense = useCallback((expense: Expense) => {
    setData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, expense],
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

  // --- Goals ---
  const setGoals = useCallback((goals: GoalConfig) => {
    setData((prev) => ({ ...prev, goals }));
  }, []);

  // --- Theme ---
  const toggleTheme = useCallback(() => {
    setData((prev) => ({ ...prev, theme: (prev.theme === 'dark' ? 'light' : 'dark') as Theme }));
  }, []);

  // --- Backup / Restore ---
  const exportBackup = useCallback(() => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driverfinance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importBackup = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string) as Partial<AppData>;
          if (parsed.earnings && Array.isArray(parsed.earnings)) {
            setData((prev) => ({
              earnings: parsed.earnings ?? prev.earnings,
              expenses: parsed.expenses ?? prev.expenses,
              vehicle: parsed.vehicle ?? prev.vehicle,
              maintenanceConfig: parsed.maintenanceConfig ?? prev.maintenanceConfig,
              goals: parsed.goals ?? prev.goals,
              theme: parsed.theme ?? prev.theme,
            }));
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  return {
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
  };
}

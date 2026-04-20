import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type {
  AppData,
  Earning,
  Expense,
  Vehicle,
  MaintenanceReserveConfig,
  GoalConfig,
  Theme,
} from '../types';

const defaultData: AppData = {
  earnings: [],
  expenses: [],
  vehicle: null,
  maintenanceConfig: {
    method: 'per_revenue',
    valuePerKm: 0.12,
    revenuePercent: 7,
  },
  goals: { earningGoal: 0, expenseLimit: 0 },
  theme: 'dark',
};

export function useAppDataFirebase() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [data, setData] = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Real-time listeners ──
  useEffect(() => {
    if (!uid) {
      setData(defaultData);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    let earningsLoaded = false;
    let expensesLoaded = false;
    let profileLoaded = false;
    let isCancelled = false;

    function checkReady() {
      if (isCancelled) return;
      if (earningsLoaded && expensesLoaded && profileLoaded) setLoading(false);
    }

    function handleError(err: unknown) {
      if (isCancelled) return;
      // Em caso de erro, desbloqueia o loading e mostra dados padrão
      earningsLoaded = true;
      expensesLoaded = true;
      profileLoaded = true;
      setError(
        err instanceof Error ? err.message : 'Erro ao conectar com o banco de dados',
      );
      setLoading(false);
    }

    // Earnings
    const unsubEarnings = onSnapshot(
      query(collection(db, `users/${uid}/earnings`)),
      (snap) => {
        if (isCancelled) return;
        const earnings = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Earning);
        setData((prev) => ({ ...prev, earnings }));
        earningsLoaded = true;
        checkReady();
      },
      handleError,
    );

    // Expenses
    const unsubExpenses = onSnapshot(
      query(collection(db, `users/${uid}/expenses`)),
      (snap) => {
        if (isCancelled) return;
        const expenses = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Expense);
        setData((prev) => ({ ...prev, expenses }));
        expensesLoaded = true;
        checkReady();
      },
      handleError,
    );

    // Profile (vehicle, config, goals, theme)
    const unsubProfile = onSnapshot(
      doc(db, `users/${uid}`),
      (snap) => {
        if (isCancelled) return;
        if (snap.exists()) {
          const profile = snap.data();
          setData((prev) => ({
            ...prev,
            vehicle: profile.vehicle ?? null,
            maintenanceConfig: profile.maintenanceConfig ?? defaultData.maintenanceConfig,
            goals: profile.goals ?? defaultData.goals,
            theme: profile.theme ?? 'dark',
          }));
        }
        profileLoaded = true;
        checkReady();
      },
      handleError,
    );

    return () => {
      isCancelled = true;
      unsubEarnings();
      unsubExpenses();
      unsubProfile();
    };
  }, [uid]);

  // Aplica tema
  useEffect(() => {
    const html = document.documentElement;
    if (data.theme === 'light') {
      html.classList.add('light');
      html.classList.remove('dark');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
  }, [data.theme]);

  // ── Helper: atualiza perfil no Firestore ──
  const updateProfile = useCallback(
    async (fields: Record<string, unknown>) => {
      if (!uid) return;
      await setDoc(doc(db, `users/${uid}`), fields, { merge: true });
    },
    [uid],
  );

  // ── Earnings ──
  const addEarning = useCallback(
    async (earning: Omit<Earning, 'id'>) => {
      if (!uid) return;
      await addDoc(collection(db, `users/${uid}/earnings`), earning);
    },
    [uid],
  );

  const updateEarning = useCallback(
    async (id: string, earning: Omit<Earning, 'id'>) => {
      if (!uid) return;
      await setDoc(doc(db, `users/${uid}/earnings`, id), earning);
    },
    [uid],
  );

  const removeEarning = useCallback(
    async (id: string) => {
      if (!uid) return;
      await deleteDoc(doc(db, `users/${uid}/earnings`, id));
    },
    [uid],
  );

  const restoreEarning = useCallback(
    async (earning: Earning) => {
      if (!uid) return;
      const { id, ...rest } = earning;
      await setDoc(doc(db, `users/${uid}/earnings`, id), rest);
    },
    [uid],
  );

  // ── Expenses ──
  const addExpense = useCallback(
    async (expense: Omit<Expense, 'id'>) => {
      if (!uid) return;
      await addDoc(collection(db, `users/${uid}/expenses`), expense);
    },
    [uid],
  );

  const updateExpense = useCallback(
    async (id: string, expense: Omit<Expense, 'id'>) => {
      if (!uid) return;
      await setDoc(doc(db, `users/${uid}/expenses`, id), expense);
    },
    [uid],
  );

  const removeExpense = useCallback(
    async (id: string) => {
      if (!uid) return;
      await deleteDoc(doc(db, `users/${uid}/expenses`, id));
    },
    [uid],
  );

  const restoreExpense = useCallback(
    async (expense: Expense) => {
      if (!uid) return;
      const { id, ...rest } = expense;
      await setDoc(doc(db, `users/${uid}/expenses`, id), rest);
    },
    [uid],
  );

  // ── Vehicle ──
  const setVehicle = useCallback(
    async (vehicle: Vehicle) => {
      await updateProfile({ vehicle });
    },
    [updateProfile],
  );

  // ── Maintenance Config ──
  const setMaintenanceConfig = useCallback(
    async (config: MaintenanceReserveConfig) => {
      await updateProfile({ maintenanceConfig: config });
    },
    [updateProfile],
  );

  // ── Goals ──
  const setGoals = useCallback(
    async (goals: GoalConfig) => {
      await updateProfile({ goals });
    },
    [updateProfile],
  );

  // ── Theme ──
  const toggleTheme = useCallback(async () => {
    const newTheme: Theme = data.theme === 'dark' ? 'light' : 'dark';
    setData((prev) => ({ ...prev, theme: newTheme }));
    await updateProfile({ theme: newTheme });
  }, [data.theme, updateProfile]);

  // ── Backup / Restore ──
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

  const importBackup = useCallback(
    async (file: File): Promise<boolean> => {
      if (!uid) return false;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const parsed = JSON.parse(e.target?.result as string) as Partial<AppData>;
            if (!parsed.earnings || !Array.isArray(parsed.earnings)) {
              resolve(false);
              return;
            }

            // Save profile
            await updateProfile({
              vehicle: parsed.vehicle ?? null,
              maintenanceConfig: parsed.maintenanceConfig ?? defaultData.maintenanceConfig,
              goals: parsed.goals ?? defaultData.goals,
              theme: parsed.theme ?? 'dark',
            });

            // Import earnings
            for (const earning of parsed.earnings) {
              const { id, ...rest } = earning;
              await setDoc(doc(db, `users/${uid}/earnings`, id), rest);
            }

            // Import expenses
            if (parsed.expenses) {
              for (const expense of parsed.expenses) {
                const { id, ...rest } = expense;
                await setDoc(doc(db, `users/${uid}/expenses`, id), rest);
              }
            }

            resolve(true);
          } catch {
            resolve(false);
          }
        };
        reader.readAsText(file);
      });
    },
    [uid, updateProfile],
  );

  // ── Migrar dados do localStorage para Firestore (one-time) ──
  const migrateFromLocalStorage = useCallback(async () => {
    if (!uid) return false;

    const MIGRATION_KEY = `driverfinance_migrated_${uid}`;
    if (localStorage.getItem(MIGRATION_KEY)) return false; // Already migrated

    const STORAGE_KEY = 'driverfinance_data';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATION_KEY, 'true'); // Mark as migrated even if no data
      return false;
    }

    try {
      // Verificar se o usuário já tem dados no Firestore
      const profileSnap = await getDoc(doc(db, `users/${uid}`));
      if (profileSnap.exists()) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        return false; // Já tem dados, não migrar
      }

      const parsed = JSON.parse(raw) as Partial<AppData>;

      await updateProfile({
        vehicle: parsed.vehicle ?? null,
        maintenanceConfig: parsed.maintenanceConfig ?? defaultData.maintenanceConfig,
        goals: parsed.goals ?? defaultData.goals,
        theme: parsed.theme ?? 'dark',
      });

      if (parsed.earnings) {
        for (const earning of parsed.earnings) {
          const { id, ...rest } = earning;
          await setDoc(doc(db, `users/${uid}/earnings`, id), rest);
        }
      }

      if (parsed.expenses) {
        for (const expense of parsed.expenses) {
          const { id, ...rest } = expense;
          await setDoc(doc(db, `users/${uid}/expenses`, id), rest);
        }
      }

      // Mark as migrated and clean up old data
      localStorage.setItem(MIGRATION_KEY, 'true');
      localStorage.removeItem(STORAGE_KEY);

      return true;
    } catch (error) {
      return false;
    }
  }, [uid, updateProfile]);

  return {
    data,
    loading,
    error,
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
  };
}
// ============================================================
// Hook useGeminiInsights — gerencia estado de chamada à IA
// ============================================================

import { useState, useCallback, useRef } from 'react';
import type { MonthlySummary, Earning, Expense, Vehicle } from '../types';
import { generateGeminiInsight } from '../lib/gemini';

interface GeminiState {
  /** Markdown retornado pela IA */
  content: string | null;
  /** Indica se a IA está processando */
  loading: boolean;
  /** Mensagem de erro (se houver) */
  error: string | null;
}

const CACHE_KEY = 'driverfinance_gemini_cache';
const COOLDOWN_MS = 30_000; // 30s entre chamadas

interface CacheEntry {
  month: string;
  hash: string;
  content: string;
  timestamp: number;
}

function computeHash(summary: MonthlySummary): string {
  return `${summary.month}|${summary.totalEarnings.toFixed(0)}|${summary.totalExpenses.toFixed(0)}|${summary.totalKm}|${summary.totalHours}`;
}

function loadCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(entry: CacheEntry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // silently fail
  }
}

export function useGeminiInsights() {
  const [state, setState] = useState<GeminiState>({
    content: null,
    loading: false,
    error: null,
  });

  const lastCallRef = useRef<number>(0);

  const generate = useCallback(
    async (
      summary: MonthlySummary,
      prevSummary: MonthlySummary | null,
      earnings: Earning[],
      expenses: Expense[],
      vehicle: Vehicle | null,
      forceRefresh = false,
    ) => {
      const hash = computeHash(summary);

      // Check cache first (skip if force refresh)
      if (!forceRefresh) {
        const cached = loadCache();
        if (cached && cached.hash === hash) {
          setState({ content: cached.content, loading: false, error: null });
          return;
        }
      }

      // Rate-limit: 30s cooldown
      const now = Date.now();
      if (now - lastCallRef.current < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - (now - lastCallRef.current)) / 1000);
        setState((prev) => ({
          ...prev,
          error: `Aguarde ${wait}s antes de gerar novo insight.`,
        }));
        return;
      }

      setState({ content: null, loading: true, error: null });
      lastCallRef.current = now;

      try {
        const content = await generateGeminiInsight(
          summary,
          prevSummary,
          earnings,
          expenses,
          vehicle,
        );

        saveCache({ month: summary.month, hash, content, timestamp: now });
        setState({ content, loading: false, error: null });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Erro desconhecido ao gerar insight';
        setState({ content: null, loading: false, error: msg });
      }
    },
    [],
  );

  return { ...state, generate };
}

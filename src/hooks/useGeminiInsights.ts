import { useState, useCallback, useRef } from 'react';
import type { MonthlySummary, Earning, Expense, Vehicle } from '../types';
import { generateGeminiInsight } from '../lib/gemini';
import { APP_CONFIG } from '../lib/constants';

interface GeminiState {
  content: string | null;
  loading: boolean;
  error: string | null;
  lastGenerated?: number;
}

interface CacheEntry {
  month: string;
  hash: string;
  content: string;
  timestamp: number;
  ttl: number;
}

interface GeminiRequestParams {
  summary: MonthlySummary;
  prevSummary: MonthlySummary | null;
  earnings: Earning[];
  expenses: Expense[];
  vehicle: Vehicle | null;
  forceRefresh?: boolean;
}

const CACHE_KEY = 'driverfinance_gemini_cache';
const COOLDOWN_MS = 30_000; // 30s entre chamadas

function computeDataHash(params: Omit<GeminiRequestParams, 'forceRefresh'>): string {
  const { summary, prevSummary, earnings, expenses, vehicle } = params;
  return `${summary.month}|${summary.totalEarnings.toFixed(0)}|${summary.totalExpenses.toFixed(0)}|${summary.totalKm}|${summary.totalHours}|${prevSummary?.totalEarnings || 0}|${earnings.length}|${expenses.length}|${vehicle?.model || ''}`;
}

function loadCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.timestamp > parsed.ttl) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(entry: CacheEntry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
}

export function useGeminiInsights() {
  const [state, setState] = useState<GeminiState>({
    content: null,
    loading: false,
    error: null,
  });

  const lastCallRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (params: GeminiRequestParams) => {
      const { summary, prevSummary, earnings, expenses, vehicle, forceRefresh = false } = params;
      const hash = computeDataHash({ summary, prevSummary, earnings, expenses, vehicle });

      // Check cache first (skip if force refresh)
      if (!forceRefresh) {
        const cached = loadCache();
        if (cached && cached.hash === hash) {
          setState({
            content: cached.content,
            loading: false,
            error: null,
            lastGenerated: cached.timestamp
          });
          return;
        }
      }

      // Rate limiting
      const now = Date.now();
      if (now - lastCallRef.current < COOLDOWN_MS) {
        setState(prev => ({
          ...prev,
          error: `Aguarde ${Math.ceil((COOLDOWN_MS - (now - lastCallRef.current)) / 1000)}s antes de gerar outro insight`,
        }));
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      lastCallRef.current = now;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const content = await generateGeminiInsight(
          summary,
          prevSummary,
          earnings,
          expenses,
          vehicle,
          abortController.signal
        );

        // Check if request was cancelled
        if (abortController.signal.aborted) return;

        // Save to cache
        const cacheEntry: CacheEntry = {
          month: summary.month,
          hash,
          content,
          timestamp: now,
          ttl: APP_CONFIG.cacheTimeout,
        };
        saveCache(cacheEntry);

        setState({
          content,
          loading: false,
          error: null,
          lastGenerated: now
        });
      } catch (error) {
        // Check if request was cancelled
        if (abortController.signal.aborted) return;

        const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar insight';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearContent = useCallback(() => {
    setState(prev => ({ ...prev, content: null, lastGenerated: undefined }));
  }, []);

  return {
    ...state,
    generate,
    clearError,
    clearContent,
    canGenerate: Date.now() - lastCallRef.current >= COOLDOWN_MS
  };
}
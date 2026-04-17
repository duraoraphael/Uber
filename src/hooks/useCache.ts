import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
}

interface CacheData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export function useCache<T>(options: CacheOptions) {
  const { ttl = 5 * 60 * 1000, key } = options; // Default 5 minutes

  const [cachedData, setCachedData] = useState<T | null>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed: CacheData<T> = JSON.parse(stored);
      const now = Date.now();

      if (now - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  });

  const setCache = useCallback((data: T) => {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      localStorage.setItem(key, JSON.stringify(cacheData));
      setCachedData(data);
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, [key, ttl]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(key);
    setCachedData(null);
  }, [key]);

  const isExpired = useCallback(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return true;

      const parsed: CacheData<T> = JSON.parse(stored);
      return Date.now() - parsed.timestamp > parsed.ttl;
    } catch {
      return true;
    }
  }, [key]);

  return {
    data: cachedData,
    setCache,
    clearCache,
    isExpired: isExpired(),
  };
}

// Hook específico para cálculos pesados
export function useMemoizedCalculation<T>(
  calculation: () => T,
  deps: React.DependencyList,
  cacheKey?: string
): T {
  const cache = useCache<T>({ key: cacheKey || `calc_${JSON.stringify(deps)}`, ttl: 30000 }); // 30 seconds

  useEffect(() => {
    if (cache.isExpired || cache.data === null) {
      const result = calculation();
      cache.setCache(result);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return cache.data!;
}
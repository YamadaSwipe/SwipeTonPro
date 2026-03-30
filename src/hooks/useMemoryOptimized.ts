/**
 * @fileoverview Memory-Optimized React Hooks
 * @author Senior Architect
 * @version 1.0.0
 * 
 * React hooks with built-in memory management
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { memoryManager } from '@/lib/memory/memoryOptimizer';

/**
 * Memory-optimized state hook with cleanup
 */
export function useMemoryState<T>(
  initialValue: T,
  cacheKey?: string
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialValue);
  const cache = cacheKey ? memoryManager.getCache<T>(cacheKey) : null;

  // Cache management
  useEffect(() => {
    if (cache && cacheKey) {
      cache.set('state', state);
    }
  }, [state, cache, cacheKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cache && cacheKey) {
        cache.clear();
      }
    };
  }, [cache, cacheKey]);

  return [state, setState];
}

/**
 * Memory-optimized effect hook with cleanup
 */
export function useMemoryEffect(
  effect: () => (() => void) | void,
  deps?: React.DependencyList
) {
  const cleanupRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    // Cleanup previous effect
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Run new effect
    const cleanup = effect();
    cleanupRef.current = cleanup && typeof cleanup === 'function' ? cleanup : undefined;

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, deps);
}

/**
 * Memory-optimized async hook
 */
export function useMemoryAsync<T>(
  asyncFn: () => Promise<T>,
  deps?: React.DependencyList
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

/**
 * Memory-optimized intersection observer hook
 */
export function useMemoryIntersection(
  options?: IntersectionObserverInit
) {
  const [entries, setEntries] = useState<IntersectionObserverEntry[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback((element: Element) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (observedEntries) => {
          setEntries(observedEntries);
        },
        options
      );
    }

    observerRef.current.observe(element);
  }, [options]);

  const unobserve = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { entries, observe, unobserve };
}

/**
 * Memory-optimized resize observer hook
 */
export function useMemoryResize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);
  const elementRef = useRef<Element | null>(null);

  const observe = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    elementRef.current = element;
    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observerRef.current.observe(element);
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { size, observe };
}

/**
 * Memory-optimized timer hook
 */
export function useMemoryTimer(
  callback: () => void,
  delay: number | null
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (delay === null) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setTimeout(callback, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [callback, delay]);
}

/**
 * Memory-optimized event listener hook
 */
export function useMemoryEvent<T extends keyof WindowEventMap>(
  event: T,
  handler: (event: WindowEventMap[T]) => void,
  options?: boolean | AddEventListenerOptions
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler = (event: WindowEventMap[T]) => {
      handlerRef.current(event);
    };

    window.addEventListener(event, wrappedHandler, options);

    return () => {
      window.removeEventListener(event, wrappedHandler, options);
    };
  }, [event, options]);
}

/**
 * Memory-optimized debounced hook
 */
export function useMemoryDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

/**
 * Memory-optimized throttled hook
 */
export function useMemoryThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
}

/**
 * Memory-optimized cached hook
 */
export function useMemoryCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000 // 5 minutes
) {
  const cache = memoryManager.getCache<T>(key, 50, ttl);
  const [data, setData] = useState<T | null>(() => cache.get('data') || null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      cache.set('data', result);
    } catch (error) {
      console.error('Cache fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, cache]);

  useEffect(() => {
    if (!data) {
      refetch();
    }
  }, [data, refetch]);

  return { data, loading, refetch };
}

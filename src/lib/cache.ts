// Cache implementation with Redis fallback to in-memory cache
import React from 'react';

interface CacheItem {
  value: any;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem>();
  private redisAvailable = false;

  constructor() {
    this.checkRedisAvailability();
  }

  private async checkRedisAvailability() {
    try {
      // Check if Redis is available
      const response = await fetch('/api/cache/health');
      this.redisAvailable = response.ok;
    } catch (error) {
      this.redisAvailable = false;
    }
  }

  async get(key: string): Promise<any | null> {
    if (this.redisAvailable) {
      try {
        const response = await fetch(`/api/cache/get?key=${encodeURIComponent(key)}`);
        if (response.ok) {
          const data = await response.json();
          return data.value;
        }
      } catch (error) {
        console.error('Redis get error:', error);
        // Fallback to memory cache
      }
    }

    // Memory cache fallback
    const item = this.memoryCache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: any, ttl: number = 300000): Promise<void> {
    const item: CacheItem = {
      value,
      timestamp: Date.now(),
      ttl
    };

    if (this.redisAvailable) {
      try {
        await fetch('/api/cache/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value, ttl }),
        });
      } catch (error) {
        console.error('Redis set error:', error);
        // Fallback to memory cache
      }
    }

    // Always store in memory cache as fallback
    this.memoryCache.set(key, item);
  }

  async del(key: string): Promise<void> {
    if (this.redisAvailable) {
      try {
        await fetch(`/api/cache/del?key=${encodeURIComponent(key)}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Redis del error:', error);
      }
    }

    this.memoryCache.delete(key);
  }

  async clear(): Promise<void> {
    if (this.redisAvailable) {
      try {
        await fetch('/api/cache/clear', { method: 'DELETE' });
      } catch (error) {
        console.error('Redis clear error:', error);
      }
    }

    this.memoryCache.clear();
  }

  // Memory cache only
  setMemory(key: string, value: any, ttl: number = 300000): void {
    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  getMemory(key: string): any | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value;
  }
}

export const cache = new CacheManager();

// React hook for caching
import { useEffect, useState } from 'react';

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get from cache first
        const cachedData = await cache.get(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const freshData = await fetcher();
        await cache.set(key, freshData, ttl);
        setData(freshData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, fetcher, ttl]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const freshData = await fetcher();
      await cache.set(key, freshData, ttl);
      setData(freshData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

// Higher-order component for caching
export function withCache<P extends object>(
  Component: React.ComponentType<P>,
  cacheKey: string,
  ttl: number = 300000
) {
  return function CachedComponent(props: P) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadData = async () => {
        try {
          setLoading(true);
          const cachedData = await cache.get(cacheKey);
          if (cachedData) {
            setData(cachedData);
            setLoading(false);
            return;
          }

          // Component should implement its own data fetching
          setLoading(false);
        } catch (error) {
          console.error('Cache error:', error);
          setLoading(false);
        }
      };

      loadData();
    }, [cacheKey]);

    if (loading) {
      return React.createElement('div', null, 'Loading...');
    }

    return React.createElement(Component, { ...props, cachedData: data });
  };
}

// Image lazy loading with caching
export function useLazyImage(src: string, ttl: number = 86400000) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedImage = await cache.get(`img_${src}`);
        if (cachedImage) {
          setImageUrl(cachedImage);
          setLoading(false);
          return;
        }

        // Create a new Image object to preload
        const img = new Image();
        img.onload = () => {
          setImageUrl(src);
          cache.set(`img_${src}`, src, ttl);
          setLoading(false);
        };
        img.onerror = () => {
          setLoading(false);
        };
        img.src = src;
      } catch (error) {
        console.error('Image loading error:', error);
        setLoading(false);
      }
    };

    if (src) {
      loadImage();
    }
  }, [src, ttl]);

  return { imageUrl, loading };
}

// API response caching
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  ttl: number = 300000
): Promise<T> {
  const cacheKey = `api_${url}_${JSON.stringify(options)}`;
  
  try {
    // Try cache first
    const cachedResponse = await cache.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch fresh data
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    // Cache the response
    await cache.set(cacheKey, data, ttl);
    return data;
  } catch (error) {
    console.error('Cached fetch error:', error);
    throw error;
  }
}

// Debounced function with caching
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  cacheKey?: string
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
      
      // Cache the result if cacheKey is provided
      if (cacheKey) {
        cache.set(cacheKey, args, wait);
      }
    }, wait);
  };
}

// Throttled function with caching
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  cacheKey?: string
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      // Cache the result if cacheKey is provided
      if (cacheKey) {
        cache.set(cacheKey, args, limit);
      }
      
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Cache invalidation utilities
export const cacheUtils = {
  // Invalidate cache by pattern
  invalidatePattern: async (pattern: string) => {
    if (cache.redisAvailable) {
      try {
        await fetch('/api/cache/invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pattern }),
        });
      } catch (error) {
        console.error('Cache invalidation error:', error);
      }
    }

    // Clear memory cache keys matching pattern
    for (const key of cache.memoryCache.keys()) {
      if (key.includes(pattern)) {
        cache.memoryCache.delete(key);
      }
    }
  },

  // Invalidate user-specific cache
  invalidateUserCache: async (userId: string) => {
    await cacheUtils.invalidatePattern(`user_${userId}`);
    await cacheUtils.invalidatePattern(`profile_${userId}`);
    await cacheUtils.invalidatePattern(`projects_${userId}`);
  },

  // Invalidate project cache
  invalidateProjectCache: async (projectId: string) => {
    await cacheUtils.invalidatePattern(`project_${projectId}`);
    await cacheUtils.invalidatePattern(`reviews_${projectId}`);
  },

  // Warm up cache for common data
  warmUpCache: async () => {
    // Preload common data
    const commonData = [
      '/api/projects?limit=10',
      '/api/professionals?limit=10',
      '/api/categories',
      '/api/settings'
    ];

    for (const url of commonData) {
      try {
        await cachedFetch(url);
      } catch (error) {
        console.error(`Cache warm-up failed for ${url}:`, error);
      }
    }
  }
};

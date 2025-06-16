import { useState, useCallback, useRef, useEffect } from "react";
import type { AsyncResponse } from "@/interface";

// Cache management
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  /** How long data stays fresh in milliseconds (default: 5 minutes) */
  freshDuration?: number;
  /** How long data stays in cache in milliseconds (default: 30 minutes) */
  maxAge?: number;
  /** Whether to return stale data while refetching (default: true) */
  staleWhileRevalidate?: boolean;
  /** Unique cache key for this request */
  cacheKey?: string;
}

class ApiRequestCache {
  private cache = new Map<string, CacheEntry>();
  private defaultOptions = {
    freshDuration: 5 * 60 * 1000,      // 5 minutes
    maxAge: 30 * 60 * 1000,            // 30 minutes
    staleWhileRevalidate: true,
  };

  generateKey(requestFn: Function, params?: any): string {
    const fnString = requestFn.toString();
    const fnHash = this.simpleHash(fnString);
    const paramsHash = params ? this.simpleHash(JSON.stringify(params)) : '';
    return `${fnHash}_${paramsHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T>;

    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  isFresh(key: string, options: CacheOptions = {}): boolean {
    const opts = { ...this.defaultOptions, ...options };
    const entry = this.cache.get(key);

    if (!entry) return false;

    const now = Date.now();
    return now < (entry.timestamp + opts.freshDuration);
  }

  isStale(key: string, options: CacheOptions = {}): boolean {
    const entry = this.get(key);
    return entry !== null && !this.isFresh(key, options);
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const opts = { ...this.defaultOptions, ...options };
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + opts.maxAge,
    };

    this.cache.set(key, entry);
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
const apiRequestCache = new ApiRequestCache();

export function useApiRequest<T = any>(cacheOptions?: CacheOptions) {
  const [response, setResponse] = useState<T | null>(null);
  const [pending, setPending] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [dirty, setDirty] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const mountedRef = useRef<boolean>(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const send = useCallback(
    async <R = T>(
      request: () => Promise<AsyncResponse<R>>,
      cb: (res: AsyncResponse<R>) => void = () => {},
      remove = false,
      beforeResolve = false
    ) => {
      if (typeof request !== "function") {
        console.error("can not be called. not a function");
        return;
      }

      const cacheKey = cacheOptions?.cacheKey || apiRequestCache.generateKey(request);
      
      if (cacheOptions || cacheKey) {
        const cachedEntry = apiRequestCache.get<R>(cacheKey);
        const isCacheFresh = apiRequestCache.isFresh(cacheKey, cacheOptions);
        const isCacheStale = apiRequestCache.isStale(cacheKey, cacheOptions);

        if (cachedEntry && isCacheFresh && mountedRef.current) {
          setResponse(cachedEntry.data as unknown as T);
          setError("");
          setSuccess(true);
          setIsFromCache(true);
          setIsStale(false);
          setDirty(true);
          setPending(false);
          setIsFetching(false);

          const mockResponse: AsyncResponse<R> = {
            success: true,
            data: cachedEntry.data,
            status: 200,
          };

          cb(mockResponse);
          return;
        }

        if (cachedEntry && isCacheStale && cacheOptions?.staleWhileRevalidate && mountedRef.current) {
          setResponse(cachedEntry.data as unknown as T);
          setError("");
          setSuccess(true);
          setIsFromCache(true);
          setIsStale(true);
          setDirty(true);
        }
      }

      if (mountedRef.current) {
        setPending(true);
        setIsFetching(true);
        setError("");
        setSuccess(false);

        if (remove) {
          setResponse(null);
          setIsFromCache(false);
          setIsStale(false);
        }
      }

      try {
        if (mountedRef.current) {
          setDirty(true);
        }

        const res = await request();

        if (mountedRef.current) {
          if (beforeResolve) cb(res);

          setPending(false);
          setIsFetching(false);

          if (!(typeof cb === "function")) return;

          if (cacheOptions && res.success && res.data !== undefined) {
            apiRequestCache.set(cacheKey, res.data, cacheOptions);
          }

          setResponse(res?.data as unknown as T ?? null);
          setError(res?.error || "");
          setSuccess(res.success || false);
          setIsFromCache(false);
          setIsStale(false);
          cb(res);
        }
      } catch (err: any) {
        if (mountedRef.current) {
          console.error(err);
          setPending(false);
          setIsFetching(false);
          setError(err.message || "An error occurred");
          setSuccess(false);
          setIsFromCache(false);
          setIsStale(false);
        }
      }
    },
    [cacheOptions]
  );

  const invalidateCache = useCallback((key?: string) => {
    const finalKey = key || cacheOptions?.cacheKey;
    if (finalKey) {
      apiRequestCache.invalidate(finalKey);
    }
  }, [cacheOptions?.cacheKey]);

  const refresh = useCallback(
    async <R = T>(
      request: () => Promise<AsyncResponse<R>>,
      cb: (res: AsyncResponse<R>) => void = () => {}
    ) => {
      if (cacheOptions?.cacheKey) {
        apiRequestCache.invalidate(cacheOptions.cacheKey);
      }
        await send(request, cb, true);
    },
    [send, cacheOptions?.cacheKey]
  );

  return {
    response,
    send,
    pending,
    error,
    success,
    dirty,
    isFromCache,
    isStale,
    isFetching,
    invalidateCache,
    refresh,
  };
}


export const cacheUtils = {
  invalidate: (key: string) => apiRequestCache.invalidate(key),
  invalidateByPattern: (pattern: string) => apiRequestCache.invalidateByPattern(pattern),
  clear: () => apiRequestCache.clear(),
  getStats: () => {
    const cache = (apiRequestCache as any).cache;
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  },
};

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useTablePagination } from "./useTablePagination";
import { useApiRequest } from "./useApiRequest";
import type { AsyncResponse } from "@/interface";

interface PaginationParams {
  search?: string;
  page: number;
  limit: number;
}

interface PaginationResponse<T = any> {
  data?: T[];
  response?: T[];
  totalPages?: number;
  length?: number;
}

interface PaginationOptions<T = any> {
  cb: (params: PaginationParams, config?: any) => Promise<AsyncResponse<PaginationResponse<T>>>;
  store?: {
    set: (data: T[]) => void;
    getAll: () => T[];
  } | null;
  auto?: boolean;
  perPage?: number;
  cache?: boolean;
  watch?: any[];
}

export function usePagination<T = any>(options: PaginationOptions<T> = {} as PaginationOptions<T>) {
  const [paginationOptions, setPaginationOptions] = useState<PaginationOptions<T>>(options);

  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(paginationOptions.perPage || 25);
  const [searching, setSearching] = useState(false);

  const req = useApiRequest<PaginationResponse<T>>();
  const searchPagination = useTablePagination(perPage);
  const pagination = useTablePagination(perPage);
  
  // Use refs for controller and timeout to persist between renders
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watch for changes in the watch array
  useEffect(() => {
    if (options.watch?.length) {
      send();
    }
  }, [...(options.watch || [])]);

  const getPaginationData = useCallback((next = true, current = false): PaginationParams => {
    if (searching) {
      return {
        search: search || undefined,
        page: next
          ? !current
            ? searchPagination.page + 1
            : searchPagination.page
          : searchPagination.page - 1,
        limit: searchPagination.limit || 25,
      };
    } else {
      return {
        search: search || undefined,
        page: next
          ? !current
            ? pagination.page + 1
            : pagination.page
          : pagination.page - 1,
        limit: pagination.limit || 25,
      };
    }
  }, [searching, search, searchPagination.page, searchPagination.limit, pagination.page, pagination.limit]);

  const fetch = useCallback((next = true, current = false, cache = false) => {
    if (req.pending || (next && pagination.done)) return;

    // if(cache && paginationOptions.store && paginationOptions.store.getAll()?.length) return

    req.send(
      () => paginationOptions.cb(getPaginationData(next, current)),
      (res) => {
        if (paginationOptions.store && res.success) {
          const responseData = res?.data?.response || res?.data?.data || [];
          paginationOptions.store.set(responseData as T[]);
        }

        pagination.setTotalPages(res.data?.totalPages || 1);
        const responseLength = (res.data?.response || res.data?.data || []).length;
        if (res.success && responseLength < pagination.limit) {
          pagination.setDone(true);
        }
      },
      true
    );
  }, [req, pagination, paginationOptions, getPaginationData]);
  
  const fetchSearch = useCallback((next = true, current = false) => {
    if (next && searchPagination.done) return;

    // Abort previous request if exists
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    
    // Clear previous timeout if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Create new abort controller
    controllerRef.current = new AbortController();

    if(paginationOptions.store) {
      paginationOptions.store.set([] as unknown as T[]);
    }
    
    timeoutRef.current = setTimeout(() => {
      req.send(
        () =>
          paginationOptions.cb(getPaginationData(next, current), {
            signal: controllerRef.current?.signal,
          }),
        (res) => {
          if(res.success && paginationOptions.store) {
            const responseData = res?.data?.response || res?.data?.data || [];
            paginationOptions.store.set(responseData as T[]);
          }

          searchPagination.setTotalPages(res.data?.totalPages || 1);
          
          const responseLength = (res.data?.response || res.data?.data || []).length;
          if (res?.success && responseLength < searchPagination.limit) {
            searchPagination.setDone(true);
          }
        },
        true
      );
    }, 20);
  }, [req, searchPagination, paginationOptions, getPaginationData]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const next = useCallback(() => {
    if (searching) {
      fetchSearch();
    } else {
      fetch(true, false, paginationOptions.cache);
    }
  }, [searching, fetchSearch, fetch, paginationOptions.cache]);

  const previous = useCallback(() => {
    if (searching && searchPagination.page === 1) return;
    if (!searching && pagination.page === 1) return;

    if (searching) {
      fetchSearch(false);
      searchPagination.setDone(false);
    } else {
      pagination.setDone(false);
      fetch(false, false, paginationOptions.cache);
    }
  }, [searching, searchPagination, pagination, fetchSearch, fetch, paginationOptions.cache]);

  // Watch for search changes
  useEffect(() => {
    searchPagination.setDone(false);
    searchPagination.setPage(0);
    
    if (search) {
      setSearching(true);
      fetchSearch(true, false);
    } else if (!search && paginationOptions.auto) {
      setSearching(false);
      pagination.setDone(false);
      fetch(true, true, paginationOptions.cache);
    }
  }, [search, searchPagination, pagination, paginationOptions, fetchSearch, fetch]);

  // Watch for auto changes
  const auto = useMemo(() => paginationOptions.auto, [paginationOptions.auto]);
  
  useEffect(() => {
    if (paginationOptions.auto) {
      fetch();
    }
  }, [auto, fetch]);

  // Watch for perPage changes
  useEffect(() => {
    pagination.reset(perPage);
    searchPagination.reset(perPage);
    
    if (search) {
      setSearching(true);
      fetchSearch(true, true);
    } else {
      setSearching(false);
      fetch(true, true, paginationOptions.cache);
    }
  }, [perPage, pagination, searchPagination, search, fetchSearch, fetch, paginationOptions.cache]);

  const send = useCallback(() => {
    pagination.reset();
    searchPagination.reset();
    fetch();
  }, [pagination, searchPagination, fetch]);

  const page = useMemo(() => {
    return searching ? searchPagination.page : pagination.page;
  }, [searching, searchPagination.page, pagination.page]);

  const totalPages = useMemo(() => {
    return req.response?.totalPages || 0;
  }, [req.response]);

  const data = useMemo((): T[] => {
    if (paginationOptions.store && !searching) {
      return paginationOptions.store.getAll();
    }
    
    const responseData = req.response?.response || req.response?.data || [];
    return responseData as T[];
  }, [paginationOptions.store, searching, req.response]);

  return {
    page,
    search: {
      value: search,
      set: setSearch
    },
    perPage: {
      value: perPage,
      set: setPerPage
    },
    send,
    totalPages,
    data,
    error: req.error,
    pending: req.pending,
    dirty: req.dirty,
    next,
    previous,
  };
}
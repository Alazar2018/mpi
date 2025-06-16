import { useState, useCallback } from "react";

export function useTablePagination(responseLimit = 25) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(responseLimit);
  const [maxPage, setMaxPage] = useState<number | undefined>();
  const [done, setDone] = useState(false);

  const reset = useCallback((newLimit?: number) => {
    setPage(0);
    if (newLimit) setLimit(newLimit);
    setDone(false);
  }, []);

  const next = useCallback(() => {
    if (page < limit) {
      setPage(prev => prev + 1);
    }
  }, [page, limit]);

  const prev = useCallback(() => {
    if (page - 1 > 0) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  return {
    reset,
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    done,
    setDone,
    totalPages,
    setTotalPages,
    maxPage,
    setMaxPage,
    next,
    prev
  };
}

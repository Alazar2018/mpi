import { useState, useEffect, useCallback } from 'react';
import { childrenService } from '@/service/children.server';
import type { Player } from '@/service/players.server';

interface UseChildrenOptions {
  limit?: number;
  autoRefresh?: boolean;
}

interface ChildrenResponse {
  children: Player[];
  total: number;
  page: number;
  totalPages: number;
}

export const useChildren = ({ limit = 10, autoRefresh = false }: UseChildrenOptions = {}) => {
  const [children, setChildren] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalChildren, setTotalChildren] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Fetch children with pagination
  const fetchChildren = useCallback(async (page: number = 1, searchQuery?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await childrenService.getChildren({
        page,
        limit,
        search: searchQuery
      });
      
      setChildren(response.children);
      setTotalChildren(response.total);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Error fetching children:', err);
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('Access denied')) {
          setError('Access denied. Only parent users can view children.');
        } else if (err.message.includes('endpoint not found')) {
          setError('Children endpoint not found. Please check your permissions.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to fetch children. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Search children
  const searchChildren = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await childrenService.searchChildren({
        search: query,
        page: 1,
        limit
      });
      
      setChildren(response.children);
      setTotalChildren(response.total);
      setCurrentPage(1);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Error searching children:', err);
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('Access denied')) {
          setError('Access denied. Only parent users can search children.');
        } else if (err.message.includes('endpoint not found')) {
          setError('Children search endpoint not found. Please check your permissions.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to search children. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Clear search and fetch all children
  const clearSearch = useCallback(() => {
    fetchChildren(1);
  }, [fetchChildren]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchChildren(currentPage);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, currentPage, fetchChildren]);

  // Initial fetch
  useEffect(() => {
    fetchChildren(1);
  }, [fetchChildren]);

  return {
    children,
    loading,
    error,
    totalChildren,
    currentPage,
    totalPages,
    fetchChildren,
    searchChildren,
    clearSearch
  };
};

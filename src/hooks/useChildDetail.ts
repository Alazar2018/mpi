import { useState, useEffect, useCallback } from 'react';
import { childrenService } from '@/service/children.server';
import type { Player } from '@/service/players.server';

interface UseChildDetailOptions {
  childId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseChildDetailReturn {
  child: Player | null;
  loading: boolean;
  error: string | null;
  fetchChild: () => Promise<void>;
  refreshChild: () => Promise<void>;
  clearError: () => void;
}

export const useChildDetail = (options: UseChildDetailOptions): UseChildDetailReturn => {
  const {
    childId,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [child, setChild] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChild = useCallback(async () => {
    if (!childId) {
      setError('Child ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch child details
      const response = await childrenService.getChildDetail(childId);
      
      if (!response) {
        throw new Error('Invalid response from server');
      }

      setChild(response.child);
      console.log('Child detail fetched successfully:', childId);
    } catch (err) {
      console.error('Error fetching child detail:', err);
      setError('Failed to fetch child details. Please try again.');
      setChild(null);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  const refreshChild = useCallback(async () => {
    await fetchChild();
  }, [fetchChild]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch child on component mount and when dependencies change
  useEffect(() => {
    fetchChild();
  }, [fetchChild]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshChild();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshChild]);

  return {
    child,
    loading,
    error,
    fetchChild,
    refreshChild,
    clearError
  };
};

import { useState, useEffect, useCallback } from 'react';
import { playersService } from '@/service/players.server';
import type { Player } from '@/service/players.server';

interface UsePlayerDetailOptions {
  playerId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UsePlayerDetailReturn {
  player: Player | null;
  loading: boolean;
  error: string | null;
  fetchPlayer: () => Promise<void>;
  refreshPlayer: () => Promise<void>;
  clearError: () => void;
}

export const usePlayerDetail = (options: UsePlayerDetailOptions): UsePlayerDetailReturn => {
  const {
    playerId,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayer = useCallback(async () => {
    if (!playerId) {
      setError('Player ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch player details
      const response = await playersService.getPlayerById(playerId);
      
      if (!response) {
        throw new Error('Invalid response from server');
      }

      setPlayer(response.player);
      console.log('Player detail fetched successfully:', playerId);
    } catch (err) {
      console.error('Error fetching player detail:', err);
      setError('Failed to fetch player details. Please try again.');
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const refreshPlayer = useCallback(async () => {
    await fetchPlayer();
  }, [fetchPlayer]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch player on component mount and when dependencies change
  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshPlayer();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshPlayer]);

  return {
    player,
    loading,
    error,
    fetchPlayer,
    refreshPlayer,
    clearError
  };
};

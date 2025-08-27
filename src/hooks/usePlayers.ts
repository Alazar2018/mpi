import { useState, useEffect, useCallback } from 'react';
import { playersService } from '@/service/players.server';
import type { Player, PlayerListResponse } from '@/service/players.server';

interface UsePlayersOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'away';
  sortBy?: 'rating' | 'usdta' | 'name';
  sortOrder?: 'asc' | 'desc';
}

interface UsePlayersReturn {
  players: Player[];
  loading: boolean;
  error: string | null;
  totalPlayers: number;
  currentPage: number;
  totalPages: number;
  fetchPlayers: (page?: number, search?: string) => Promise<void>;
  searchPlayers: (query: string) => Promise<void>;
  clearSearch: () => void;
  refreshPlayers: () => Promise<void>;
}

export const usePlayers = (options: UsePlayersOptions = {}): UsePlayersReturn => {
  const {
    page: initialPage = 1,
    limit = 9,
    search: initialSearch = '',
    status,
    sortBy,
    sortOrder = 'desc'
  } = options;

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const fetchPlayers = useCallback(async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let response: PlayerListResponse;
      
      if (search || searchQuery) {
        const query = search || searchQuery;
        response = await playersService.searchPlayers(query, page, limit);
      } else if (status) {
        response = await playersService.getPlayersByStatus(status, page, limit);
      } else if (sortBy === 'rating') {
        response = await playersService.getPlayersSortedByRating(sortOrder, page, limit);
      } else if (sortBy === 'usdta') {
        response = await playersService.getPlayersSortedByUSDTA(sortOrder, page, limit);
      } else {
        response = await playersService.getPlayers(page, limit);
      }
      
      // Validate response structure
      if (!response) {
        throw new Error('Invalid response from server');
      }
      
      // Handle new API response structure
      const playersData = response.players || [];
      const totalCount = playersData.length;
      
      // Ensure playersData is an array
      if (!Array.isArray(playersData)) {
        console.warn('Players data is not an array:', playersData);
        setPlayers([]);
        setTotalPlayers(0);
        return;
      }
      
      // If no players returned, provide fallback data for development
      if (playersData.length === 0 && totalCount === 0) {
        console.log('No players returned from API, using fallback data');
        const fallbackPlayers: Player[] = [
          {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: { email: 'john@example.com' },
            phoneNumber: { countryCode: 'US', number: '1234567890' },
            avatar: undefined,
            lastOnline: new Date().toISOString(),
            parents: [],
            coaches: [],
            coachGoals: [],
            classes: []
          },
          {
            _id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            emailAddress: { email: 'jane@example.com' },
            phoneNumber: { countryCode: 'US', number: '0987654321' },
            avatar: undefined,
            lastOnline: new Date().toISOString(),
            parents: [],
            coaches: [],
            coachGoals: [],
            classes: []
          }
        ];
        setPlayers(fallbackPlayers);
        setTotalPlayers(2);
        setCurrentPage(page);
        return;
      }
      
      setPlayers(playersData);
      setTotalPlayers(totalCount);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to fetch players. Please try again.');
      setPlayers([]);
      setTotalPlayers(0);
    } finally {
      setLoading(false);
    }
  }, [limit, searchQuery, status, sortBy, sortOrder]);

  const searchPlayers = useCallback(async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    await fetchPlayers(1, query);
  }, [fetchPlayers]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchPlayers(1);
  }, [fetchPlayers]);

  const refreshPlayers = useCallback(async () => {
    await fetchPlayers(currentPage, searchQuery);
  }, [fetchPlayers, currentPage, searchQuery]);

  // Fetch players on component mount and when dependencies change
  useEffect(() => {
    fetchPlayers(initialPage, initialSearch);
  }, [fetchPlayers, initialPage, initialSearch]);

  const totalPages = Math.ceil(totalPlayers / limit);

  return {
    players,
    loading,
    error,
    totalPlayers,
    currentPage,
    totalPages,
    fetchPlayers,
    searchPlayers,
    clearSearch,
    refreshPlayers
  };
};

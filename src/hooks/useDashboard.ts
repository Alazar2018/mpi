import { useState, useEffect } from 'react';
import { dashboardService } from '@/service/dashboard.server';
import { useAuthStore } from '@/store/auth.store';
import type { DashboardResponse, PlayerDashboardResponse } from '@/service/dashboard.server';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authStore = useAuthStore();
  const userRole = authStore.getRole();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user has permission to access dashboard data
      if (!userRole) {
        setError('User role not found. Please log in again.');
        return;
      }

      // Only players and admins can access the main dashboard endpoint
      if (userRole !== 'player' && userRole !== 'admin') {
        setError('Access denied. Dashboard data is only available for players.');
        return;
      }

      // Get basic dashboard data
      const data = await dashboardService.getMyDashboard();
      
      // Get user-specific matches if we have a user ID
      if (authStore.user?._id) {
        try {
          const userMatches = await dashboardService.getCurrentUserMatches(authStore.user._id);
          
          // Update the dashboard data with user-specific matches
          const enhancedData = {
            ...data,
            recentMatches: userMatches.recentMatches,
            upcomingMatches: userMatches.upcomingMatches
          };
          
          setDashboardData(enhancedData);
        } catch (matchError) {
          console.log('Could not fetch user-specific matches, using basic data:', matchError);
          setDashboardData(data);
        }
      } else {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    if (userRole) {
      fetchDashboardData();
    }
  }, [userRole]);

  return {
    dashboardData,
    loading,
    error,
    refreshDashboard,
  };
};

export const usePlayerDashboard = (playerId: string) => {
  const [playerData, setPlayerData] = useState<PlayerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authStore = useAuthStore();
  const userRole = authStore.getRole();

  const fetchPlayerData = async () => {
    if (!playerId) return;

    try {
      setLoading(true);
      setError(null);

      // Check if user has permission to access player dashboard data
      if (!userRole) {
        setError('User role not found. Please log in again.');
        return;
      }

      // Only coaches, parents, and admins can access other players' dashboard data
      if (userRole !== 'coach' && userRole !== 'parent' && userRole !== 'admin') {
        setError('Access denied. Only coaches, parents, and administrators can view player dashboard data.');
        return;
      }

      const data = await dashboardService.getPlayerDashboard(playerId);
      setPlayerData(data);
    } catch (err) {
      console.error('Error fetching player dashboard data:', err);
      setError('Failed to load player dashboard data. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const refreshPlayerData = () => {
    fetchPlayerData();
  };

  useEffect(() => {
    if (userRole && playerId) {
      fetchPlayerData();
    }
  }, [playerId, userRole]);

  return {
    playerData,
    loading,
    error,
    refreshPlayerData,
  };
};

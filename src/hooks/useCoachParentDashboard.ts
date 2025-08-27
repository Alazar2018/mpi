import { useState, useEffect } from 'react';
import { todoService } from '@/service/todo.server';
import { useAuthStore } from '@/store/auth.store';

export interface CoachParentDashboardData {
  pendingTodos: number;
  completedTodos: number;
  overdueTodos: number;
  totalTodos: number;
  latestTodos: any[];
  loading: boolean;
  error: string | null;
}

export const useCoachParentDashboard = () => {
  const [dashboardData, setDashboardData] = useState<CoachParentDashboardData>({
    pendingTodos: 0,
    completedTodos: 0,
    overdueTodos: 0,
    totalTodos: 0,
    latestTodos: [],
    loading: true,
    error: null
  });

  const authStore = useAuthStore();
  const userRole = authStore.getRole();

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      // Check if user has permission to access todo functionality
      if (!userRole || (userRole !== 'coach' && userRole !== 'parent')) {
        setDashboardData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Access denied. Todo functionality is only available for coaches and parents.' 
        }));
        return;
      }

      // Fetch todo counts and latest todos
      const [countsResponse, latestResponse] = await Promise.all([
        todoService.getTodosCount(),
        todoService.getLatestTodos()
      ]);

      if (countsResponse && latestResponse) {
        setDashboardData({
          pendingTodos: countsResponse.pending,
          completedTodos: countsResponse.completed,
          overdueTodos: 0, // Will be calculated from latest todos
          totalTodos: countsResponse.total,
          latestTodos: latestResponse.success ? latestResponse.data.todos : [],
          loading: false,
          error: null
        });

        // Calculate overdue todos from latest todos
        if (latestResponse.success && latestResponse.data.todos) {
          const overdueCount = latestResponse.data.todos.filter(todo => 
            todoService.isOverdue(todo)
          ).length;
          
          setDashboardData(prev => ({ ...prev, overdueTodos: overdueCount }));
        }
      }
    } catch (err) {
      console.error('Error fetching coach/parent dashboard data:', err);
      setDashboardData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to load dashboard data. Please try again.' 
      }));
    }
  };

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    if (userRole && (userRole === 'coach' || userRole === 'parent')) {
      fetchDashboardData();
    }
  }, [userRole]);

  return {
    ...dashboardData,
    refreshDashboard,
    userRole
  };
};

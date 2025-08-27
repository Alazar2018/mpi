import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import SOTService from '@/service/sot.server';
import type { 
  Periodization, 
  CreatePeriodizationRequest,
  UpdatePeriodizationRequest,
  UpdateStatusRequest,
  AddPreparationRequest,
  AddCompetitionRequest,
  AddTransitionRequest
} from '@/service/sot.server';

export const useSOT = () => {
  const { id: playerId } = useParams<{ id: string }>();
  const [periodizations, setPeriodizations] = useState<Periodization[]>([]);
  const [currentPeriodization, setCurrentPeriodization] = useState<Periodization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all periodizations for the player
  const fetchPeriodizations = useCallback(async () => {
    if (!playerId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await SOTService.getPlayerPeriodizations(playerId);
      setPeriodizations(response.periodizations);
      
      // Set current periodization to the first active one, or the first one if none are active
      const activePeriodization = response.periodizations.find(p => p.status === 'active');
      setCurrentPeriodization(activePeriodization || response.periodizations[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch periodizations');
      console.error('Error fetching periodizations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  // Fetch specific periodization detail
  const fetchPeriodizationDetail = useCallback(async (periodizationId: string) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await SOTService.getPeriodizationDetail(playerId, periodizationId);
      // Update the current periodization with detailed data
      setCurrentPeriodization(response as Periodization);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch periodization detail');
      console.error('Error fetching periodization detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  // Create new periodization
  const createPeriodization = useCallback(async (data: CreatePeriodizationRequest) => {
    if (!playerId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newPeriodizations = await SOTService.createPeriodization(playerId, data);
      setPeriodizations(newPeriodizations);
      
      // Set the newly created periodization as current
      if (newPeriodizations.length > 0) {
        setCurrentPeriodization(newPeriodizations[0]);
      }
      
      return newPeriodizations;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create periodization');
      console.error('Error creating periodization:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  // Update periodization
  const updatePeriodization = useCallback(async (periodizationId: string, data: UpdatePeriodizationRequest) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPeriodization = await SOTService.updatePeriodization(playerId, periodizationId, data);
      
      // Update the periodizations list
      setPeriodizations(prev => 
        prev.map(p => p._id === periodizationId ? updatedPeriodization : p)
      );
      
      // Update current periodization if it's the one being updated
      if (currentPeriodization?._id === periodizationId) {
        setCurrentPeriodization(updatedPeriodization);
      }
      
      return updatedPeriodization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update periodization');
      console.error('Error updating periodization:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, currentPeriodization]);

  // Update periodization status
  const updatePeriodizationStatus = useCallback(async (periodizationId: string, status: UpdateStatusRequest['status']) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPeriodization = await SOTService.updatePeriodizationStatus(playerId, periodizationId, { status });
      
      // Update the periodizations list
      setPeriodizations(prev => 
        prev.map(p => p._id === periodizationId ? updatedPeriodization : p)
      );
      
      // Update current periodization if it's the one being updated
      if (currentPeriodization?._id === periodizationId) {
        setCurrentPeriodization(updatedPeriodization);
      }
      
      return updatedPeriodization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update periodization status');
      console.error('Error updating periodization status:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, currentPeriodization]);

  // Delete periodization
  const deletePeriodization = useCallback(async (periodizationId: string) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const remainingPeriodizations = await SOTService.deletePeriodization(playerId, periodizationId);
      setPeriodizations(remainingPeriodizations);
      
      // If we deleted the current periodization, set a new one
      if (currentPeriodization?._id === periodizationId) {
        setCurrentPeriodization(remainingPeriodizations[0] || null);
      }
      
      return remainingPeriodizations;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete periodization');
      console.error('Error deleting periodization:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, currentPeriodization]);

  // Add preparation phase
  const addPreparationPhase = useCallback(async (periodizationId: string, data: AddPreparationRequest) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPeriodization = await SOTService.addPreparationPhase(playerId, periodizationId, data);
      
      // Update the periodizations list
      setPeriodizations(prev => 
        prev.map(p => p._id === periodizationId ? updatedPeriodization : p)
      );
      
      // Update current periodization if it's the one being updated
      if (currentPeriodization?._id === periodizationId) {
        setCurrentPeriodization(updatedPeriodization);
      }
      
      return updatedPeriodization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add preparation phase');
      console.error('Error adding preparation phase:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, currentPeriodization]);

  // Add competition phase
  const addCompetitionPhase = useCallback(async (periodizationId: string, data: AddCompetitionRequest) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPeriodization = await SOTService.addCompetitionPhase(playerId, periodizationId, data);
      
      // Update the periodizations list
      setPeriodizations(prev => 
        prev.map(p => p._id === periodizationId ? updatedPeriodization : p)
      );
      
      // Update current periodization if it's the one being updated
      if (currentPeriodization?._id === periodizationId) {
        setCurrentPeriodization(updatedPeriodization);
      }
      
      return updatedPeriodization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add competition phase');
      console.error('Error adding competition phase:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, currentPeriodization]);

  // Add transition phase
  const addTransitionPhase = useCallback(async (periodizationId: string, data: AddTransitionRequest) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPeriodization = await SOTService.addTransitionPhase(playerId, periodizationId, data);
      
      // Update the periodizations list
      setPeriodizations(prev => 
        prev.map(p => p._id === periodizationId ? updatedPeriodization : p)
      );
      
      // Update current periodization if it's the one being updated
      if (currentPeriodization?._id === periodizationId) {
        setCurrentPeriodization(updatedPeriodization);
      }
      
      return updatedPeriodization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transition phase');
      console.error('Error adding transition phase:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, currentPeriodization]);

  // Update preparation phase
  const updatePreparationPhase = useCallback(async (periodizationId: string, data: AddPreparationRequest) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPeriodization = await SOTService.updatePreparationPhase(playerId, periodizationId, data);
      
      // Update the periodizations list
      setPeriodizations(prev => 
        prev.map(p => p._id === periodizationId ? updatedPeriodization : p)
      );
      
      // Update current periodization if it's the one being updated
      if (currentPeriodization?._id === periodizationId) {
        setCurrentPeriodization(updatedPeriodization);
      }
      
      return updatedPeriodization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preparation phase');
      console.error('Error updating preparation phase:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, currentPeriodization]);

  // Update competition phase
  const updateCompetitionPhase = useCallback(async (periodizationId: string, data: AddCompetitionRequest) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPeriodization = await SOTService.updateCompetitionPhase(playerId, periodizationId, data);
      
      // Update the periodizations list
      setPeriodizations(prev => 
        prev.map(p => p._id === periodizationId ? updatedPeriodization : p)
      );
      
      // Update current periodization if it's the one being updated
      if (currentPeriodization?._id === periodizationId) {
        setCurrentPeriodization(updatedPeriodization);
      }
      
      return updatedPeriodization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update competition phase');
      console.error('Error updating competition phase:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, currentPeriodization]);

  // Update transition phase
  const updateTransitionPhase = useCallback(async (periodizationId: string, data: AddTransitionRequest) => {
    if (!playerId || !periodizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPeriodization = await SOTService.updateTransitionPhase(playerId, periodizationId, data);
      
      // Update the periodizations list
      setPeriodizations(prev => 
        prev.map(p => p._id === periodizationId ? updatedPeriodization : p)
      );
      
      // Update current periodization if it's the one being updated
      if (currentPeriodization?._id === periodizationId) {
        setCurrentPeriodization(updatedPeriodization);
      }
      
      return updatedPeriodization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transition phase');
      console.error('Error updating transition phase:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, currentPeriodization]);

  // Helper functions
  const calculateProgress = useCallback((periodization: Periodization) => {
    return SOTService.calculateProgress(periodization);
  }, []);

  const getDayProgress = useCallback((periodization: Periodization) => {
    return SOTService.getDayProgress(periodization);
  }, []);

  const setCurrentPeriodizationById = useCallback((periodizationId: string) => {
    const periodization = periodizations.find(p => p._id === periodizationId);
    if (periodization) {
      setCurrentPeriodization(periodization);
    }
  }, [periodizations]);

  // Load periodizations on mount
  useEffect(() => {
    fetchPeriodizations();
  }, [fetchPeriodizations]);

  return {
    // State
    periodizations,
    currentPeriodization,
    isLoading,
    error,
    
    // Actions
    fetchPeriodizations,
    fetchPeriodizationDetail,
    createPeriodization,
    updatePeriodization,
    updatePeriodizationStatus,
    deletePeriodization,
    addPreparationPhase,
    addCompetitionPhase,
    addTransitionPhase,
    updatePreparationPhase,
    updateCompetitionPhase,
    updateTransitionPhase,
    setCurrentPeriodizationById,
    
    // Helpers
    calculateProgress,
    getDayProgress,
    
    // Clear error
    clearError: () => setError(null)
  };
};

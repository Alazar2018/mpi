import { useState, useEffect, useCallback } from 'react';
import {
  getMyClassScheduleRequests,
  getMyCoaches,
  createClassScheduleRequest,
  updateClassScheduleRequest,
  deleteClassScheduleRequest,
  getCoachAvailability,
  getMyChildren,
  getChildCoaches,
  createClassScheduleRequestForChild,
  getCoachClassScheduleRequests,
  respondToClassScheduleRequest,
  updateCoachResponse,
} from '@/service/classSchedule.server';
import type {
  ClassScheduleRequest,
  User,
  AvailabilitySlot,
  CreateClassScheduleRequest,
  UpdateClassScheduleRequest,
  CoachResponseRequest
} from '@/service/classSchedule.server';
import { useAuthStore } from '@/store/auth.store';

export const useClassSchedule = () => {
  const [requests, setRequests] = useState<ClassScheduleRequest[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Get user role
  const userRole = user?.role || 'player';

  // Fetch my class schedule requests
  const fetchMyRequests = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyClassScheduleRequests(page, limit);
      setRequests(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch my coaches
  const fetchMyCoaches = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyCoaches(page, limit);
      setCoaches(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch my children (for parents)
  const fetchMyChildren = useCallback(async (page = 1, limit = 10) => {
    if (userRole !== 'parent') return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getMyChildren(page, limit);
      setChildren(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch children');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Fetch child's coaches (for parents)
  const fetchChildCoaches = useCallback(async (childId: string, page = 1, limit = 10) => {
    if (userRole !== 'parent') return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getChildCoaches(childId, page, limit);
      setCoaches(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch child coaches');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Fetch coach's class schedule requests (for coaches)
  const fetchCoachRequests = useCallback(async (page = 1, limit = 10, status?: string) => {
    if (userRole !== 'coach') return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getCoachClassScheduleRequests(page, limit, status);
      setRequests(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch coach requests');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Create class schedule request
  const createRequest = useCallback(async (
    coachId: string,
    data: CreateClassScheduleRequest
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await createClassScheduleRequest(coachId, data);
      setRequests(response.data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create class schedule request for child (for parents)
  const createRequestForChild = useCallback(async (
    playerId: string,
    coachId: string,
    data: CreateClassScheduleRequest
  ) => {
    if (userRole !== 'parent') return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await createClassScheduleRequestForChild(playerId, coachId, data);
      setRequests(response.data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create request for child');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Update class schedule request
  const updateRequest = useCallback(async (
    id: string,
    data: UpdateClassScheduleRequest
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await updateClassScheduleRequest(id, data);
      // Update the request in the list
      setRequests(prev => prev.map(req => 
        req._id === id ? response.data : req
      ));
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete class schedule request
  const deleteRequest = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteClassScheduleRequest(id);
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get coach availability
  const fetchCoachAvailability = useCallback(async (
    coachId: string,
    date: string,
    timezone: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCoachAvailability(coachId, date, timezone);
      setAvailability(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  }, []);

  // Respond to class schedule request (for coaches)
  const respondToRequest = useCallback(async (
    id: string,
    data: CoachResponseRequest
  ) => {
    if (userRole !== 'coach') return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await respondToClassScheduleRequest(id, data);
      // Update the request in the list
      setRequests(prev => prev.map(req => 
        req._id === id ? response.data : req
      ));
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to respond to request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Update coach response
  const updateCoachResponseHandler = useCallback(async (
    id: string,
    data: CoachResponseRequest
  ) => {
    if (userRole !== 'coach') return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await updateCoachResponse(id, data);
      // Update the request in the list
      setRequests(prev => prev.map(req => 
        req._id === id ? response.data : req
      ));
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update coach response');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch based on user role
  useEffect(() => {
    if (userRole === 'coach') {
      fetchCoachRequests();
    } else if (userRole === 'parent') {
      fetchMyChildren();
    } else {
      fetchMyRequests();
      fetchMyCoaches();
    }
  }, [userRole, fetchMyRequests, fetchMyCoaches, fetchMyChildren, fetchCoachRequests]);

  return {
    // State
    requests,
    coaches,
    children,
    availability,
    loading,
    error,
    userRole,
    
    // Actions
    fetchMyRequests,
    fetchMyCoaches,
    fetchMyChildren,
    fetchChildCoaches,
    fetchCoachRequests,
    createRequest,
    createRequestForChild,
    updateRequest,
    deleteRequest,
    fetchCoachAvailability,
    respondToRequest,
    updateCoachResponseHandler,
    clearError
  };
};

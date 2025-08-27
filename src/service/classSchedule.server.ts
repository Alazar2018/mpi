import axiosInstance from "@/config/axios.config";
import { API_CONFIG } from "@/config/api.config";

// Types for Class Schedule module based on API response
export interface ClassScheduleRequest {
  _id: string;
  userId: string | User;
  coachId: string | User;
  date: string;
  status: 'pending' | 'accepted' | 'rejected';
  playerNote?: string;
  coachNote?: string;
  createdAt: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  emailAddress: {
    email: string;
  };
  phoneNumber: {
    countryCode: string;
    number: string;
  };
  avatar?: string;
  lastOnline: string;
  __t?: string;
  id?: string;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
}

export interface ClassScheduleListResponse {
  success: boolean;
  message: string;
  data: ClassScheduleRequest[];
}

export interface ClassScheduleDetailResponse {
  success: boolean;
  message: string;
  data: ClassScheduleRequest;
}

export interface CoachAvailabilityResponse {
  success: boolean;
  message: string;
  data: AvailabilitySlot[];
}

export interface CreateClassScheduleRequest {
  date: string;
  playerNote?: string;
  timezone: string;
}

export interface UpdateClassScheduleRequest {
  date?: string;
  playerNote?: string;
  timezone: string;
}

export interface CoachResponseRequest {
  status: 'accepted' | 'rejected';
  coachNote?: string;
}

// Player Endpoints
export const getMyClassScheduleRequests = async (
  page: number = 1,
  limit: number = 10,
  sort: string = '-createdAt'
): Promise<ClassScheduleListResponse> => {
  const response = await axiosInstance.get('/api/v1/class-schedule', {
    params: { page, limit, sort }
  });
  return response.data;
};

export const getMyCoaches = async (
  page: number = 1,
  limit: number = 10,
  sort: string = 'firstName'
): Promise<{ success: boolean; message: string; data: User[] }> => {
  const response = await axiosInstance.get('/api/v1/class-schedule/myCoaches', {
    params: { page, limit, sort }
  });
  return response.data;
};

export const createClassScheduleRequest = async (
  coachId: string,
  data: CreateClassScheduleRequest
): Promise<ClassScheduleListResponse> => {
  const response = await axiosInstance.post(`/api/v1/class-schedule/${coachId}/create`, data);
  return response.data;
};

export const getClassScheduleRequest = async (id: string): Promise<ClassScheduleDetailResponse> => {
  const response = await axiosInstance.get(`/api/v1/class-schedule/${id}`);
  return response.data;
};

export const updateClassScheduleRequest = async (
  id: string,
  data: UpdateClassScheduleRequest
): Promise<ClassScheduleDetailResponse> => {
  const response = await axiosInstance.patch(`/api/v1/class-schedule/${id}`, data);
  return response.data;
};

export const deleteClassScheduleRequest = async (id: string): Promise<{ success: boolean; message: string; data: { _id: string; status: string } }> => {
  const response = await axiosInstance.delete(`/api/v1/class-schedule/${id}`);
  return response.data;
};

export const getCoachAvailability = async (
  coachId: string,
  date: string,
  timezone: string
): Promise<CoachAvailabilityResponse> => {
  const response = await axiosInstance.get(`/api/v1/class-schedule/${coachId}/availability`, {
    params: { date, timezone }
  });
  return response.data;
};

// Parent Endpoints
export const getMyChildren = async (
  page: number = 1,
  limit: number = 10,
  sort: string = 'firstName'
): Promise<{ success: boolean; message: string; data: User[] }> => {
  const response = await axiosInstance.get('/api/v1/class-schedule/myChildren', {
    params: { page, limit, sort }
  });
  return response.data;
};

export const getChildCoaches = async (
  childId: string,
  page: number = 1,
  limit: number = 10,
  sort: string = 'firstName'
): Promise<{ success: boolean; message: string; data: User[] }> => {
  const response = await axiosInstance.get(`/api/v1/class-schedule/child/${childId}/coaches`, {
    params: { page, limit, sort }
  });
  return response.data;
};

export const createClassScheduleRequestForChild = async (
  playerId: string,
  coachId: string,
  data: CreateClassScheduleRequest
): Promise<ClassScheduleListResponse> => {
  const response = await axiosInstance.post(`/api/v1/class-schedule/${playerId}/${coachId}/create`, data);
  return response.data;
};

// Coach Endpoints
export const getCoachClassScheduleRequests = async (
  page: number = 1,
  limit: number = 10,
  sort: string = '-createdAt',
  status?: string
): Promise<ClassScheduleListResponse> => {
  const response = await axiosInstance.get('/api/v1/class-schedule/coach', {
    params: { page, limit, sort, status }
  });
  return response.data;
};

export const respondToClassScheduleRequest = async (
  id: string,
  data: CoachResponseRequest
): Promise<ClassScheduleDetailResponse> => {
  const response = await axiosInstance.post(`/api/v1/class-schedule/${id}/coach-response`, data);
  return response.data;
};

export const updateCoachResponse = async (
  id: string,
  data: CoachResponseRequest
): Promise<ClassScheduleDetailResponse> => {
  const response = await axiosInstance.patch(`/api/v1/class-schedule/${id}/coach-response`, data);
  return response.data;
};

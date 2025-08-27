import axiosInstance from "@/config/axios.config";
import { API_CONFIG } from "@/config/api.config";

// Types for SOT/Periodization module based on API response
export interface Periodization {
  _id: string;
  startingDate: string;
  endingDate: string;
  status: 'active' | 'inactive' | 'completed' | 'cancelled' | 'pending';
  physical: TrainingPhase;
  technical: TrainingPhase;
  psychological: TrainingPhase;
  tactical: TrainingPhase;
  nutrition: TrainingPhase;
  recovery: TrainingPhase;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPhase {
  preparation: PreparationPhase | null;
  competition: CompetitionPhase | null;
  transition: TransitionPhase | null;
}

export interface PreparationPhase {
  allocatedTime: number;
  timeType: 'days' | 'weeks' | 'months';
  generals: string[];
  specifics: string[]; // Array of goal IDs
  specificDescriptions: string[];
}

export interface CompetitionPhase {
  allocatedTime: number;
  timeType: 'days' | 'weeks' | 'months';
  precompetitions: string[];
  tournaments: string[];
}

export interface TransitionPhase {
  allocatedTime: number;
  timeType: 'days' | 'weeks' | 'months';
  activeRest: string[];
}

export interface CreatePeriodizationRequest {
  startingDate: string;
  endingDate: string;
  timezone: string;
}

export interface UpdatePeriodizationRequest {
  startingDate?: string;
  endingDate?: string;
  timezone?: string;
}

export interface UpdateStatusRequest {
  status: 'active' | 'inactive' | 'completed' | 'cancelled' | 'pending';
}

export interface AddPreparationRequest {
  preparationType: 'physical' | 'technical' | 'psychological' | 'tactical' | 'nutrition' | 'recovery';
  preparation: {
    allocatedTime: number;
    timeType: 'days' | 'weeks' | 'months';
    generals: string[];
    specifics: string[];
    specificDescriptions: string[];
  };
}

export interface AddCompetitionRequest {
  competitionType: 'physical' | 'technical' | 'psychological' | 'tactical' | 'nutrition' | 'recovery';
  competition: {
    allocatedTime: number;
    timeType: 'days' | 'weeks' | 'months';
    precompetitions: string[];
    tournaments: string[];
  };
}

export interface AddTransitionRequest {
  transitionType: 'physical' | 'technical' | 'psychological' | 'tactical' | 'nutrition' | 'recovery';
  transition: {
    allocatedTime: number;
    timeType: 'days' | 'weeks' | 'months';
    activeRest: string[];
  };
}

export interface PeriodizationListResponse {
  periodizations: Periodization[];
}

export interface PeriodizationDetailResponse {
  _id: string;
  startingDate: string;
  endingDate: string;
  status: string;
  physical: TrainingPhase;
  technical: TrainingPhase;
  psychological: TrainingPhase;
  tactical: TrainingPhase;
  nutrition: TrainingPhase;
  recovery: TrainingPhase;
}

// SOT Service class
export class SOTService {
  private static readonly BASE_URL = `${API_CONFIG.BASE_URL}/api/v1/periodizations`;

  /**
   * Get all periodizations for a specific player
   */
  static async getPlayerPeriodizations(
    playerId: string,
    page?: number,
    limit?: number,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<PeriodizationListResponse> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (sort) params.append('sort', sort);
      if (order) params.append('order', order);

      const url = `${this.BASE_URL}/${playerId}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching player periodizations:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific periodization
   */
  static async getPeriodizationDetail(
    playerId: string,
    periodizationId: string
  ): Promise<PeriodizationDetailResponse> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching periodization detail:', error);
      throw error;
    }
  }

  /**
   * Create a new periodization sequence for a player
   */
  static async createPeriodization(
    playerId: string,
    data: CreatePeriodizationRequest
  ): Promise<Periodization[]> {
    try {
      const url = `${this.BASE_URL}/${playerId}`;
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      console.error('Error creating periodization:', error);
      throw error;
    }
  }

  /**
   * Update basic periodization information
   */
  static async updatePeriodization(
    playerId: string,
    periodizationId: string,
    data: UpdatePeriodizationRequest
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}`;
      const response = await axiosInstance.patch(url, data);
      return response.data;
    } catch (error) {
      console.error('Error updating periodization:', error);
      throw error;
    }
  }

  /**
   * Update the status of a periodization
   */
  static async updatePeriodizationStatus(
    playerId: string,
    periodizationId: string,
    data: UpdateStatusRequest
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/status`;
      const response = await axiosInstance.patch(url, data);
      return response.data;
    } catch (error) {
      console.error('Error updating periodization status:', error);
      throw error;
    }
  }

  /**
   * Delete a periodization sequence
   */
  static async deletePeriodization(
    playerId: string,
    periodizationId: string
  ): Promise<Periodization[]> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}`;
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      console.error('Error deleting periodization:', error);
      throw error;
    }
  }

  /**
   * Add preparation phase to a specific domain
   */
  static async addPreparationPhase(
    playerId: string,
    periodizationId: string,
    data: AddPreparationRequest
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/preparation`;
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      console.error('Error adding preparation phase:', error);
      throw error;
    }
  }

  /**
   * Update an existing preparation phase
   */
  static async updatePreparationPhase(
    playerId: string,
    periodizationId: string,
    data: AddPreparationRequest
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/preparation`;
      const response = await axiosInstance.patch(url, data);
      return response.data;
    } catch (error) {
      console.error('Error updating preparation phase:', error);
      throw error;
    }
  }

  /**
   * Remove preparation phase from a domain
   */
  static async deletePreparationPhase(
    playerId: string,
    periodizationId: string,
    preparationType: string
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/preparation`;
      const response = await axiosInstance.delete(url, {
        data: { preparationType }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting preparation phase:', error);
      throw error;
    }
  }

  /**
   * Add competition phase to a specific domain
   */
  static async addCompetitionPhase(
    playerId: string,
    periodizationId: string,
    data: AddCompetitionRequest
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/competition`;
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      console.error('Error adding competition phase:', error);
      throw error;
    }
  }

  /**
   * Update an existing competition phase
   */
  static async updateCompetitionPhase(
    playerId: string,
    periodizationId: string,
    data: AddCompetitionRequest
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/competition`;
      const response = await axiosInstance.patch(url, data);
      return response.data;
    } catch (error) {
      console.error('Error updating competition phase:', error);
      throw error;
    }
  }

  /**
   * Remove competition phase from a domain
   */
  static async deleteCompetitionPhase(
    playerId: string,
    periodizationId: string,
    competitionType: string
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/competition`;
      const response = await axiosInstance.delete(url, {
        data: { competitionType }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting competition phase:', error);
      throw error;
    }
  }

  /**
   * Add transition phase to a specific domain
   */
  static async addTransitionPhase(
    playerId: string,
    periodizationId: string,
    data: AddTransitionRequest
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/transition`;
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      console.error('Error adding transition phase:', error);
      throw error;
    }
  }

  /**
   * Update an existing transition phase
   */
  static async updateTransitionPhase(
    playerId: string,
    periodizationId: string,
    data: AddTransitionRequest
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/transition`;
      const response = await axiosInstance.patch(url, data);
      return response.data;
    } catch (error) {
      console.error('Error updating transition phase:', error);
      throw error;
    }
  }

  /**
   * Remove transition phase from a domain
   */
  static async deleteTransitionPhase(
    playerId: string,
    periodizationId: string,
    transitionType: string
  ): Promise<Periodization> {
    try {
      const url = `${this.BASE_URL}/${playerId}/${periodizationId}/transition`;
      const response = await axiosInstance.delete(url, {
        data: { transitionType }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting transition phase:', error);
      throw error;
    }
  }

  /**
   * Helper method to calculate progress percentage for a periodization
   */
  static calculateProgress(periodization: Periodization): number {
    const startDate = new Date(periodization.startingDate);
    const endDate = new Date(periodization.endingDate);
    const currentDate = new Date();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();
    
    if (totalDuration <= 0) return 0;
    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;
    
    return Math.round((elapsed / totalDuration) * 100);
  }

  /**
   * Helper method to get current day and total days
   */
  static getDayProgress(periodization: Periodization): { currentDay: number; totalDays: number } {
    const startDate = new Date(periodization.startingDate);
    const endDate = new Date(periodization.endingDate);
    const currentDate = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      currentDay: Math.max(0, Math.min(currentDay, totalDays)),
      totalDays: Math.max(1, totalDays)
    };
  }
}

export default SOTService;

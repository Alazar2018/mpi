import axiosInstance from "@/config/axios.config";
import type { 
  PersonalAchievement, 
  CreateAchievementRequest, 
  UpdateAchievementRequest
} from "@/interface";

// Response interface for achievements API
export interface AchievementResponse {
  success: boolean;
  message: string;
  data?: PersonalAchievement | PersonalAchievement[];
  error?: string;
}

// Achievements API Service
class AchievementsService {
  private baseUrl = 'https://mpiglobal.org/api/v1/users/achievements';

  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Get all achievements for the current user
   * GET /users/achievements
   */
  async getAllAchievements(): Promise<PersonalAchievement[]> {
    try {
      console.log('Fetching all achievements');
      
      const response = await axiosInstance.get<{ achievements: PersonalAchievement[] }>(this.baseUrl);
      
      console.log('Achievements fetched successfully:', response.data.achievements);
      return response.data.achievements;
    } catch (error) {
      console.error("Error fetching achievements:", error);
      throw error;
    }
  }

  /**
   * Get a single achievement by ID
   * GET /users/achievements/:id
   */
  async getAchievementById(id: string): Promise<PersonalAchievement> {
    try {
      console.log('Fetching achievement by ID:', id);
      
      const response = await axiosInstance.get<{ achievement: PersonalAchievement }>(`${this.baseUrl}/${id}`);
      
      console.log('Achievement fetched successfully:', response.data.achievement);
      return response.data.achievement;
    } catch (error) {
      console.error("Error fetching achievement:", error);
      throw error;
    }
  }

  /**
   * Create a new achievement
   * POST /users/achievements
   */
  async createAchievement(data: CreateAchievementRequest): Promise<PersonalAchievement> {
    try {
      console.log('Creating achievement:', data);
      
      const response = await axiosInstance.post<{ achievement: PersonalAchievement }>(this.baseUrl, data);
      
      console.log('Achievement created successfully:', response.data.achievement);
      return response.data.achievement;
    } catch (error) {
      console.error("Error creating achievement:", error);
      throw error;
    }
  }

  /**
   * Update an existing achievement
   * PATCH /users/achievements/:id
   */
  async updateAchievement(id: string, data: UpdateAchievementRequest): Promise<PersonalAchievement> {
    try {
      console.log('Updating achievement:', { id, data });
      
      const response = await axiosInstance.patch<{ achievement: PersonalAchievement }>(`${this.baseUrl}/${id}`, data);
      
      console.log('Achievement updated successfully:', response.data.achievement);
      return response.data.achievement;
    } catch (error) {
      console.error("Error updating achievement:", error);
      throw error;
    }
  }

  /**
   * Delete an achievement
   * DELETE /users/achievements/:id
   */
  async deleteAchievement(id: string): Promise<void> {
    try {
      console.log('Deleting achievement:', id);
      
      await axiosInstance.delete(`${this.baseUrl}/${id}`);
      
      console.log('Achievement deleted successfully');
    } catch (error) {
      console.error("Error deleting achievement:", error);
      throw error;
    }
  }

  /**
   * Archive an achievement (if supported by API)
   * PATCH /users/achievements/:id/archive
   */
  async archiveAchievement(id: string): Promise<PersonalAchievement> {
    try {
      console.log('Archiving achievement:', id);
      
      const response = await axiosInstance.patch<{ achievement: PersonalAchievement }>(`${this.baseUrl}/${id}/archive`);
      
      console.log('Achievement archived successfully:', response.data.achievement);
      return response.data.achievement;
    } catch (error) {
      console.error("Error archiving achievement:", error);
      throw error;
    }
  }

  /**
   * Unarchive an achievement (if supported by API)
   * PATCH /users/achievements/:id/unarchive
   */
  async unarchiveAchievement(id: string): Promise<PersonalAchievement> {
    try {
      console.log('Unarchiving achievement:', id);
      
      const response = await axiosInstance.patch<{ achievement: PersonalAchievement }>(`${this.baseUrl}/${id}/unarchive`);
      
      console.log('Achievement unarchived successfully:', response.data.achievement);
      return response.data.achievement;
    } catch (error) {
      console.error("Error unarchiving achievement:", error);
      throw error;
    }
  }

  /**
   * Validate achievement data before sending to API
   */
  validateAchievementData(data: CreateAchievementRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Achievement title is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Achievement description is required');
    }

    if (!data.achievedOn) {
      errors.push('Achievement date is required');
    } else {
      const achievementDate = new Date(data.achievedOn);
      const today = new Date();
      if (achievementDate > today) {
        errors.push('Achievement date cannot be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export instance
export const achievementsService = new AchievementsService();

// Export individual functions for backward compatibility
export const getAllAchievements = () => achievementsService.getAllAchievements();
export const createAchievement = (data: CreateAchievementRequest) => achievementsService.createAchievement(data);
export const updateAchievement = (id: string, data: UpdateAchievementRequest) => achievementsService.updateAchievement(id, data);
export const deleteAchievement = (id: string) => achievementsService.deleteAchievement(id);
export const archiveAchievement = (id: string) => achievementsService.archiveAchievement(id);
export const unarchiveAchievement = (id: string) => achievementsService.unarchiveAchievement(id);
import axiosInstance from "@/config/axios.config";

// Types for Goal Management
export interface GoalAction {
  description: string;
  date: string;
  isDone: boolean;
}

export interface GoalObstacle {
  description: string;
  date: string;
  isOvercome: boolean;
}

export interface GoalProgress {
  description: string;
  date: string;
  isDone: boolean;
}

export interface CreateGoalRequest {
  goal: 'technical' | 'tactical' | 'physical' | 'mental' | 'nutrition' | 'recovery';
  description: string;
  term: 'short' | 'medium' | 'long';
  measurement: string;
  achievementDate: string;
  actions: GoalAction[];
  obstacles: GoalObstacle[];
  progress?: GoalProgress[];
  addOns?: string;
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {}

export interface GoalResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Goals API Service
class GoalsService {
  private baseUrl = 'https://mpiglobal.org/api/v1/users';

  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Add a new goal for a player
   * POST /playerGoal/:id
   */
  async addPlayerGoal(playerId: string, goalData: CreateGoalRequest): Promise<GoalResponse> {
    try {
      console.log('Adding player goal:', { playerId, goalData });
      
      const response = await axiosInstance.post<GoalResponse>(
        `${this.baseUrl}/playerGoal/${playerId}`,
        goalData
      );

      console.log('Goal added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding player goal:', error);
      throw error;
    }
  }

  /**
   * Update an existing player goal
   * PATCH /playerGoal/:id/:goalId
   */
  async updatePlayerGoal(
    playerId: string, 
    goalId: string, 
    goalData: UpdateGoalRequest
  ): Promise<GoalResponse> {
    try {
      console.log('Updating player goal:', { playerId, goalId, goalData });
      
      const response = await axiosInstance.patch<GoalResponse>(
        `${this.baseUrl}/playerGoal/${playerId}/${goalId}`,
        goalData
      );

      console.log('Goal updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating player goal:', error);
      throw error;
    }
  }

  /**
   * Delete a player goal
   * DELETE /playerGoal/:id/:goalId
   */
  async deletePlayerGoal(playerId: string, goalId: string): Promise<GoalResponse> {
    try {
      console.log('Deleting player goal:', { playerId, goalId });
      
      const response = await axiosInstance.delete<GoalResponse>(
        `${this.baseUrl}/playerGoal/${playerId}/${goalId}`
      );

      console.log('Goal deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting player goal:', error);
      throw error;
    }
  }

  /**
   * Mark a goal action as completed
   */
  async markActionAsDone(
    playerId: string, 
    goalId: string, 
    actionId: string, 
    isDone: boolean
  ): Promise<GoalResponse> {
    try {
      console.log('Marking action as done:', { playerId, goalId, actionId, isDone });
      
      const response = await axiosInstance.patch<GoalResponse>(
        `${this.baseUrl}/playerGoal/${playerId}/${goalId}/action/${actionId}`,
        { isDone }
      );

      console.log('Action status updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating action status:', error);
      throw error;
    }
  }

  /**
   * Mark a goal obstacle as overcome
   */
  async markObstacleAsOvercome(
    playerId: string, 
    goalId: string, 
    obstacleId: string, 
    isOvercome: boolean
  ): Promise<GoalResponse> {
    try {
      console.log('Marking obstacle as overcome:', { playerId, goalId, obstacleId, isOvercome });
      
      const response = await axiosInstance.patch<GoalResponse>(
        `${this.baseUrl}/playerGoal/${playerId}/${goalId}/obstacle/${obstacleId}`,
        { isOvercome }
      );

      console.log('Obstacle status updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating obstacle status:', error);
      throw error;
    }
  }

  /**
   * Add a new action to an existing goal
   */
  async addGoalAction(
    playerId: string, 
    goalId: string, 
    action: Omit<GoalAction, 'isDone'>
  ): Promise<GoalResponse> {
    try {
      console.log('Adding goal action:', { playerId, goalId, action });
      
      const response = await axiosInstance.post<GoalResponse>(
        `${this.baseUrl}/playerGoal/${playerId}/${goalId}/action`,
        { ...action, isDone: false }
      );

      console.log('Action added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding goal action:', error);
      throw error;
    }
  }

  /**
   * Add a new obstacle to an existing goal
   */
  async addGoalObstacle(
    playerId: string, 
    goalId: string, 
    obstacle: Omit<GoalObstacle, 'isOvercome'>
  ): Promise<GoalResponse> {
    try {
      console.log('Adding goal obstacle:', { playerId, goalId, obstacle });
      
      const response = await axiosInstance.post<GoalResponse>(
        `${this.baseUrl}/playerGoal/${playerId}/${goalId}/obstacle`,
        { ...obstacle, isOvercome: false }
      );

      console.log('Obstacle added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding goal obstacle:', error);
      throw error;
    }
  }

  /**
   * Mark a goal as achieved
   */
  async markGoalAsAchieved(
    playerId: string, 
    goalId: string
  ): Promise<GoalResponse> {
    try {
      console.log('Marking goal as achieved:', { playerId, goalId });
      
      const response = await axiosInstance.patch<GoalResponse>(
        `${this.baseUrl}/playerGoal/${playerId}/${goalId}/status`,
        { status: 'achieved' }
      );

      console.log('Goal marked as achieved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error marking goal as achieved:', error);
      throw error;
    }
  }

  /**
   * Get goal progress statistics
   */
  async getGoalProgress(playerId: string): Promise<{
    totalGoals: number;
    achievedGoals: number;
    plannedGoals: number;
    progressPercentage: number;
  }> {
    try {
      console.log('Getting goal progress for player:', playerId);
      
      // This would typically be a separate API endpoint
      // For now, we'll return a placeholder structure
      return {
        totalGoals: 0,
        achievedGoals: 0,
        plannedGoals: 0,
        progressPercentage: 0
      };
    } catch (error) {
      console.error('Error getting goal progress:', error);
      throw error;
    }
  }

  /**
   * Validate goal data before sending to API
   */
  validateGoalData(goalData: CreateGoalRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!goalData.goal) {
      errors.push('Goal type is required');
    }

    if (!goalData.description || goalData.description.trim().length === 0) {
      errors.push('Goal description is required');
    }

    if (!goalData.term) {
      errors.push('Goal term is required');
    }

    if (!goalData.measurement || goalData.measurement.trim().length === 0) {
      errors.push('Goal measurement is required');
    }

    if (!goalData.achievementDate) {
      errors.push('Achievement date is required');
    }

    if (goalData.actions && goalData.actions.length > 0) {
      goalData.actions.forEach((action, index) => {
        if (!action || !action.description || action.description.trim().length === 0) {
          errors.push(`Action ${index + 1} description is required`);
        }
        if (!action.date) {
          errors.push(`Action ${index + 1} date is required`);
        }
      });
    }

    if (goalData.obstacles && goalData.obstacles.length > 0) {
      goalData.obstacles.forEach((obstacle, index) => {
        if (!obstacle || !obstacle.description || obstacle.description.trim().length === 0) {
          errors.push(`Obstacle ${index + 1} description is required`);
        }
        if (!obstacle.date) {
          errors.push(`Obstacle ${index + 1} date is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export instance
export const goalsService = new GoalsService();

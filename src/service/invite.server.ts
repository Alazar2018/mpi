import axiosInstance from "@/config/axios.config";
import { API_CONFIG } from "@/config/api.config";

// Types for Invite module
export interface InviteRequest {
  email: string;
  relationship: 'parent' | 'coach' | 'child' | 'player' | 'join';
}

export interface InviteResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface InviteError {
  success: false;
  error: {
    message: string;
    status: number;
  };
}

// Invite API Service
class InviteService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Send invitation to another user
   * POST /api/v1/users/invite
   */
  async sendInvite(data: InviteRequest): Promise<InviteResponse> {
    try {
      const response = await axiosInstance.post<InviteResponse>(API_CONFIG.ENDPOINTS.USERS.INVITE, data);
      
      console.log('Invite API Response:', response.data);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error in sendInvite:', error);
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      
      throw new Error('Failed to send invitation');
    }
  }

  /**
   * Get available relationship types based on current user's role
   */
  getAvailableRelationships(currentRole: string): Array<{ value: string; label: string }> {
    switch (currentRole) {
      case "player":
        return [
          { value: "parent", label: "Parent" },
          { value: "coach", label: "Coach" }
        ];
      case "coach":
        return [
          { value: "player", label: "Player" },
          { value: "parent", label: "Parent" }
        ];
      case "parent":
        return [
          { value: "coach", label: "Coach" },
          { value: "player", label: "Player" }
        ];
      default:
        return [
          { value: "parent", label: "Parent" },
          { value: "coach", label: "Coach" },
          { value: "player", label: "Player" }
        ];
    }
  }

  /**
   * Validate if the relationship type is valid for the current user
   */
  isValidRelationship(currentRole: string, relationship: string): boolean {
    const availableRelationships = this.getAvailableRelationships(currentRole);
    return availableRelationships.some(r => r.value === relationship);
  }
}

// Create and export instance
export const inviteService = new InviteService();

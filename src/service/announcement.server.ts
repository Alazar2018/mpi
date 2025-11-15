import axiosInstance from "@/config/axios.config";
import { useAuthStore } from "@/store/auth.store";

// Types for Announcement module based on API response
export interface AnnouncementUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
  lastOnline: string;
}

export interface Announcement {
  _id: string;
  title: string;
  description: string;
  category: 'match' | 'training' | 'message' | 'course';
  announcedTo: string;
  createdBy: AnnouncementUser | string;
  deletedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  description: string;
  category: 'match' | 'training' | 'message' | 'course';
  announcedTo?: 'All' | 'Players' | 'Coaches' | 'Parents' | 'None';
}

export interface UpdateAnnouncementRequest {
  title?: string;
  description?: string;
  category?: 'match' | 'training' | 'message' | 'course';
  announcedTo?: 'All' | 'Players' | 'Coaches' | 'Parents' | 'None';
}

export interface AnnouncementsResponse {
  success: boolean;
  message: string;
  data: {
    announcements: Announcement[];
    totalCount: number;
  };
}

export interface SingleAnnouncementResponse {
  success: boolean;
  message: string;
  data: Announcement;
}

// For operations that return a single announcement (create, update, delete)
export interface SingleAnnouncementOperationResponse {
  success: boolean;
  message: string;
  data: Announcement;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  category?: 'match' | 'training' | 'message' | 'course';
}

// Announcement API Service
class AnnouncementService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Check if user has coach role
   */
  private isCoach(): boolean {
    const authStore = useAuthStore.getState();
    return authStore.getRole() === 'coach';
  }

  /**
   * Check if user has player role
   */
  private isPlayer(): boolean {
    const authStore = useAuthStore.getState();
    return authStore.getRole() === 'player';
  }

  /**
   * Check if user has parent role
   */
  private isParent(): boolean {
    const authStore = useAuthStore.getState();
    return authStore.getRole() === 'parent';
  }

  /**
   * Create a new announcement (Coach only)
   * POST /api/v1/announcements
   */
  async createAnnouncement(data: CreateAnnouncementRequest): Promise<SingleAnnouncementOperationResponse> {
    if (!this.isCoach()) {
      throw new Error('Only coaches can create announcements');
    }

    const response = await axiosInstance.post<SingleAnnouncementOperationResponse>('/api/v1/announcements', data);
    return response.data;
  }

  /**
   * Get all announcements with role-based filtering
   * GET /api/v1/announcements
   */
  async getAnnouncements(params: PaginationParams = {}): Promise<AnnouncementsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.category) queryParams.append('category', params.category);

    const url = `/api/v1/announcements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get<AnnouncementsResponse>(url);
    return response.data;
  }

  /**
   * Mark announcement as read
   * PATCH /api/v1/announcements/:id/read
   */
  async markAsRead(announcementId: string): Promise<AnnouncementsResponse> {
    if (!this.isCoach() && !this.isPlayer() && !this.isParent()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.patch<AnnouncementsResponse>(`/api/v1/announcements/${announcementId}/read`);
    return response.data;
  }

  /**
   * Get my announcements
   * GET /api/v1/announcements/me
   */
  async getMyAnnouncements(params: PaginationParams = {}): Promise<AnnouncementsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.category) queryParams.append('category', params.category);

    const url = `/api/v1/announcements/me${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get<AnnouncementsResponse>(url);
    return response.data;
  }

  /**
   * Get single my announcement (Coach only)
   * GET /api/v1/announcements/my/:id
   */
  async getMyAnnouncement(announcementId: string): Promise<SingleAnnouncementResponse> {
    if (!this.isCoach()) {
      throw new Error('Only coaches can view their own announcements');
    }

    const response = await axiosInstance.get<SingleAnnouncementResponse>(`/api/v1/announcements/me/${announcementId}`);
    return response.data;
  }

  /**
   * Update my announcement (Coach only)
   * PATCH /api/v1/announcements/my/:id
   */
  async updateMyAnnouncement(announcementId: string, data: UpdateAnnouncementRequest): Promise<SingleAnnouncementOperationResponse> {
    if (!this.isCoach()) {
      throw new Error('Only coaches can update announcements');
    }

    const response = await axiosInstance.patch<SingleAnnouncementOperationResponse>(`/api/v1/announcements/me/${announcementId}`, data);
    return response.data;
  }

  /**
   * Delete my announcement (Coach only)
   * DELETE /api/v1/announcements/my/:id
   */
  async deleteMyAnnouncement(announcementId: string): Promise<AnnouncementsResponse> {
    if (!this.isCoach()) {
      throw new Error('Only coaches can delete announcements');
    }

    const response = await axiosInstance.delete<AnnouncementsResponse>(`/api/v1/announcements/me/${announcementId}`);
    return response.data;
  }

  /**
   * Soft delete announcement (hide from view)
   * DELETE /api/v1/announcements/:id
   */
  async softDeleteAnnouncement(announcementId: string): Promise<AnnouncementsResponse> {
    if (!this.isCoach() && !this.isPlayer() && !this.isParent()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.delete<AnnouncementsResponse>(`/api/v1/announcements/${announcementId}`);
    return response.data;
  }

  /**
   * Clear all announcements (hide all from view)
   * DELETE /api/v1/announcements
   */
  async clearAllAnnouncements(): Promise<AnnouncementsResponse> {
    if (!this.isCoach() && !this.isPlayer() && !this.isParent()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.delete<AnnouncementsResponse>('/api/v1/announcements');
    return response.data;
  }

  /**
   * Get available categories based on user role
   */
  getAvailableCategories(): string[] {
    if (this.isCoach()) {
      return ['match', 'training', 'message', 'course'];
    }
    return ['match', 'training', 'message', 'course']; // All users can see all categories
  }

  /**
   * Check if user can create announcements
   */
  canCreateAnnouncements(): boolean {
    return this.isCoach();
  }

  /**
   * Check if user can edit announcements
   */
  canEditAnnouncements(): boolean {
    return this.isCoach();
  }

  /**
   * Check if user can delete announcements
   */
  canDeleteAnnouncements(): boolean {
    return this.isCoach() || this.isPlayer() || this.isParent();
  }

  /**
   * Format announcement date for display
   */
  formatAnnouncementDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  /**
   * Format announcement time for display
   */
  formatAnnouncementTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
}

// Create and export instance
export const announcementService = new AnnouncementService();

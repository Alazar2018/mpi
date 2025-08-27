import { axiosInstance } from '@/config/axios.config';
import { API_CONFIG } from '@/config/api.config';
import type { Player } from './players.server';

// Request interfaces
export interface GetChildrenParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SearchChildrenParams {
  search: string;
  page?: number;
  limit?: number;
}

// Response interfaces
export interface ChildrenListResponse {
  children: Player[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ChildDetailResponse {
  child: Player;
}

// Children API Service
class ChildrenService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Get list of children for the current parent user
   * GET /api/v1/users/children
   */
  async getChildren(params: GetChildrenParams = {}): Promise<ChildrenListResponse> {
    try {
      const { page = 1, limit = 10, search } = params;
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        queryParams.append('search', search);
      }
      
      const response = await axiosInstance.get(`${API_CONFIG.ENDPOINTS.CHILDREN.LIST}?${queryParams}`);
      
      // Debug: Log the actual response structure
      console.log('Children API Response:', {
        status: response.status,
        data: response.data,
        hasPlayers: !!response.data?.players,
        hasSuccess: !!response.data?.success,
        playersCount: response.data?.players?.length || 0
      });
      
      // Handle the actual API response format
      if (response.data && response.data.players) {
        // Transform the response to match our expected format
        return {
          children: response.data.players,
          total: response.data.players.length,
          page: page,
          totalPages: Math.ceil(response.data.players.length / limit)
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where response.data is directly an array
        return {
          children: response.data,
          total: response.data.length,
          page: page,
          totalPages: Math.ceil(response.data.length / limit)
        };
      } else if (response.data && response.data.success) {
        // Fallback to expected format if it exists
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch children');
      }
    } catch (error: any) {
      console.error('Error in getChildren:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only parent users can view children.');
      } else if (error.response?.status === 404) {
        throw new Error('Children endpoint not found. Please check your permissions.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch children');
      }
    }
  }

  /**
   * Search children by name or other criteria
   * GET /api/v1/users/children/search
   */
  async searchChildren(params: SearchChildrenParams): Promise<ChildrenListResponse> {
    try {
      const { search, page = 1, limit = 10 } = params;
      
      const queryParams = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await axiosInstance.get(`${API_CONFIG.ENDPOINTS.CHILDREN.SEARCH}?${queryParams}`);
      
      // Debug: Log the actual response structure
      console.log('Children Search API Response:', {
        status: response.status,
        data: response.data,
        hasPlayers: !!response.data?.players,
        hasSuccess: !!response.data?.success,
        playersCount: response.data?.players?.length || 0
      });
      
      // Handle the actual API response format
      if (response.data && response.data.players) {
        // Transform the response to match our expected format
        return {
          children: response.data.players,
          total: response.data.players.length,
          page: page,
          totalPages: Math.ceil(response.data.players.length / limit)
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where response.data is directly an array
        return {
          children: response.data,
          total: response.data.length,
          page: page,
          totalPages: Math.ceil(response.data.length / limit)
        };
      } else if (response.data && response.data.success) {
        // Fallback to expected format if it exists
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch children');
      }
    } catch (error: any) {
      console.error('Error in searchChildren:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only parent users can search children.');
      } else if (error.response?.status === 404) {
        throw new Error('Children search endpoint not found. Please check your permissions.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Failed to search children');
      }
    }
  }

  /**
   * Get detailed information about a specific child
   * GET /api/v1/users/children/:id
   */
  async getChildDetail(childId: string): Promise<ChildDetailResponse> {
    try {
      if (!childId) {
        throw new Error('Child ID is required');
      }
      
      const response = await axiosInstance.get(API_CONFIG.ENDPOINTS.CHILDREN.DETAIL.replace(':id', childId));
      
      // Debug: Log the actual response structure
      console.log('Child Detail API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        hasPlayer: !!response.data?.player,
        hasPlayers: !!response.data?.players,
        playersCount: response.data?.players?.length || 0,
        hasSuccess: !!response.data?.success,
        childId: childId
      });
      
      // Handle the actual API response format
      if (response.data && response.data.player) {
        // Transform the response to match our expected format
        return {
          child: response.data.player
        };
      } else if (response.data && response.data.players && response.data.players.length > 0) {
        // Handle case where response has players array (like the API response you showed)
        return {
          child: response.data.players[0]
        };
      } else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Handle case where response.data is directly an array
        return {
          child: response.data[0]
        };
      } else if (response.data && response.data.success) {
        // Fallback to expected format if it exists
        return response.data.data;
      } else if (response.data && response.data._id) {
        // Handle case where response.data is directly the player object
        return {
          child: response.data
        };
      } else {
        throw new Error(response.data?.message || 'Failed to fetch child details');
      }
    } catch (error: any) {
      console.error('Error in getChildDetail:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. You can only view your own children.');
      } else if (error.response?.status === 404) {
        throw new Error('Child not found or you do not have permission to view this child.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch child details');
      }
    }
  }

  /**
   * Test URL construction for debugging
   */
  testUrlConstruction() {
    const baseUrl = 'https://mpiglobal.org';
    console.log('Children Service URL Construction Test:');
    console.log('Base URL:', baseUrl);
    console.log('List endpoint:', `${baseUrl}${API_CONFIG.ENDPOINTS.CHILDREN.LIST}`);
    console.log('Search endpoint:', `${baseUrl}${API_CONFIG.ENDPOINTS.CHILDREN.SEARCH}`);
    console.log('Detail endpoint:', `${baseUrl}${API_CONFIG.ENDPOINTS.CHILDREN.DETAIL.replace(':id', 'test-id')}`);
  }
}

// Create and export instance
export const childrenService = new ChildrenService();
export default childrenService;

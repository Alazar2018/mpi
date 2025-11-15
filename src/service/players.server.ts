import axiosInstance from "@/config/axios.config";
import { API_CONFIG } from "@/config/api.config";


// Types for Players module based on API response
export interface Player {
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
  parents: Array<{
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
  }>;
  coaches: Array<{
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
  }>;
  coachGoals: Array<{
    _id: string;
    coach: {
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
    };
    goals: Array<{
      _id: string;
      goal: string;
      term: string;
      description: string;
      measurement: string;
      achievementDate: string;
      actions: Array<{
        _id: string;
        description: string;
        date: string;
        isDone: boolean;
      }>;
      obstacles: Array<{
        _id: string;
        description: string;
        isOvercome: boolean;
      }>;
      addOn: string;
      progress: any[];
    }>;
  }>;
  classes: any[];
}

export interface PlayerListResponse {
  players: Player[];
}

export interface PlayerDetailResponse {
  player: Player;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
  averageRating: number;
  totalUSDTA: number;
}

export interface PlayerWithStats extends Player {
  stats?: PlayerStats;
}

// Players API Service
class PlayersService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Test method to verify URL construction
   */
  testUrlConstruction() {
    const endpoint = API_CONFIG.ENDPOINTS.PLAYERS.LIST;
    const fullUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
    const axiosUrl = axiosInstance.defaults.baseURL + endpoint;
    
   
    
    return { endpoint, fullUrl, axiosUrl };
  }

  /**
   * Get all players for coach users
   * GET /players
   */
  async getPlayers(page: number = 1, limit: number = 10): Promise<PlayerListResponse> {
    try {
      
      
 
      
      // Force the correct URL if there's a mismatch
      const correctUrl = 'https://mpiglobal.org/api/v1/users/players';
      
      const response = await axiosInstance.get<PlayerListResponse>(correctUrl, {
        params: { page, limit }
      });
      
    
      
      // Validate response structure
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getPlayers:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific player
   * GET /players/:id
   */
  async getPlayerById(playerId: string): Promise<PlayerDetailResponse> {
   
    // Force the correct URL if there's a mismatch
    const correctUrl = `https://mpiglobal.org/api/v1/users/players/${playerId}`;
    
    
    const response = await axiosInstance.get<PlayerDetailResponse>(correctUrl);
    return response.data;
  }

  /**
   * Get player with additional statistics
   * GET /players/:id/stats
   */
    async getPlayerWithStats(playerId: string): Promise<PlayerWithStats> {
    const [playerResponse, statsResponse] = await Promise.all([
      this.getPlayerById(playerId),
      axiosInstance.get<{ data: PlayerStats }>(`${API_CONFIG.ENDPOINTS.PLAYERS.STATS.replace(':id', playerId)}`)
    ]);

    return {
      ...playerResponse.player,
      stats: statsResponse.data.data
    };
  }

  /**
   * Search players by name
   * GET /api/v1/users/players?name=searchTerm
   * Uses the same endpoint as getPlayers but with name query parameter
   */
  async searchPlayers(query: string, page: number = 1, limit: number = 10): Promise<PlayerListResponse> {
    const params: any = { 
      name: query,
      page,
      limit
    };
    
    // Use the same endpoint as getPlayers with name parameter
    const correctUrl = 'https://mpiglobal.org/api/v1/users/players';
    
    const response = await axiosInstance.get<PlayerListResponse>(correctUrl, {
      params
    });
    
    return response.data;
  }

  /**
   * Get players by status
   * GET /players?status=active
   */
  async getPlayersByStatus(status: 'active' | 'inactive' | 'away', page: number = 1, limit: number = 10): Promise<PlayerListResponse> {
    const response = await axiosInstance.get<PlayerListResponse>(API_CONFIG.ENDPOINTS.PLAYERS.LIST, {
      params: { status, page, limit }
    });
    return response.data;
  }

  /**
   * Get players sorted by rating
   * GET /players?sortBy=rating&sortOrder=desc
   */
  async getPlayersSortedByRating(sortOrder: 'asc' | 'desc' = 'desc', page: number = 1, limit: number = 10): Promise<PlayerListResponse> {
    const response = await axiosInstance.get<PlayerListResponse>(API_CONFIG.ENDPOINTS.PLAYERS.LIST, {
      params: { sortBy: 'rating', sortOrder, page, limit }
    });
    return response.data;
  }

  /**
   * Get players sorted by USDTA
   * GET /players?sortBy=usdta&sortOrder=desc
   */
  async getPlayersSortedByUSDTA(sortOrder: 'asc' | 'desc' = 'desc', page: number = 1, limit: number = 10): Promise<PlayerListResponse> {
    const response = await axiosInstance.get<PlayerListResponse>(API_CONFIG.ENDPOINTS.PLAYERS.LIST, {
      params: { sortBy: 'usdta', sortOrder, page, limit }
    });
    return response.data;
  }

  /**
   * Get active players count
   */
  async getActivePlayersCount(): Promise<number> {
    const response = await this.getPlayersByStatus('active', 1, 1);
    return response.players?.length || 0;
  }

  /**
   * Get inactive players count
   */
  async getInactivePlayersCount(): Promise<number> {
    const response = await this.getPlayersByStatus('inactive', 1, 1);
    return response.players?.length || 0;
  }

  /**
   * Get away players count
   */
  async getAwayPlayersCount(): Promise<number> {
    const response = await this.getPlayersByStatus('away', 1, 1);
    return response.players?.length || 0;
  }

  /**
   * Get player initials from name
   */
  getPlayerInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Get default avatar color based on player name
   */
  getDefaultAvatarColor(name: string): string {
    const colors = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-blue-500',
      'from-orange-400 to-red-500',
      'from-purple-400 to-pink-500',
      'from-teal-400 to-green-500',
      'from-indigo-400 to-purple-500'
    ];
    
    // Use name to consistently assign colors
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Format last seen time
   */
  formatLastSeen(lastSeen: string): string {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return `${Math.floor(diffInMinutes / 10080)}w ago`;
  }

  /**
   * Check if player is online (active within last 5 minutes)
   */
  isPlayerOnline(lastSeen: string): boolean {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    return diffInMinutes < 5;
  }
}

// Create and export instance
export const playersService = new PlayersService();

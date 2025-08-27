import axiosInstance from "@/config/axios.config";

// Types for Matches module based on API response
export interface MatchPlayer {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
  // Optional fields that might not always be present
  emailAddress?: {
    email: string;
  };
  phoneNumber?: {
    countryCode: string;
    number: string;
  };
  lastOnline?: string;
}

export interface MatchCreator {
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
}

export interface MatchSet {
  _id: string;
  setNumber: number;
  p1Score: number;
  p2Score: number;
  p1SetReport?: {
    service: {
      aces: number;
      doubleFaults: number;
      firstServePercentage: number;
      secondServePercentage: number;
    };
    return: {
      breakPointsWon: number;
      breakPointsFaced: number;
    };
  };
  p2SetReport?: {
    service: {
      aces: number;
      doubleFaults: number;
      firstServePercentage: number;
      secondServePercentage: number;
    };
    return: {
      breakPointsWon: number;
      breakPointsFaced: number;
    };
  };
}

export interface MatchScore {
  p1Score: string;
  p2Score: string;
  isSecondService?: boolean;
  p1Reaction?: string;
  p2Reaction?: string;
  missedShot?: string;
  placement?: string;
  missedShotWay?: string;
  betweenPointDuration?: number;
  type?: string;
  rallies?: string;
  servePlacement?: string;
}

export interface MatchGameData {
  gameNumber: number;
  scores: MatchScore[];
  changeoverDuration?: number;
  server: string;
}

export interface MatchTieBreak {
  scores: string[];
  winner: string;
}

export interface MatchSetData {
  p1TotalScore: number;
  p2TotalScore: number;
  games: MatchGameData[];
  tieBreak?: MatchTieBreak;
}

export interface MatchReport {
  winner: string;
  totalSets: number;
  totalGames: number;
  totalPoints: number;
  duration: string;
  highlights: string[];
}

export interface Match {
  _id: string;
  p1: MatchPlayer | string;
  p2: MatchPlayer | string;
  p1IsObject: boolean;
  p2IsObject: boolean;
  p1Name?: string;
  p2Name?: string;
  matchCreator: MatchCreator;
  matchType: "one" | "three" | "five";
  matchCategory: "practice" | "tournament";
  tournamentType?: string;
  tournamentLevel?: string;
  status: "pending" | "accepted" | "rejected" | "in_progress" | "completed" | "cancelled";
  trackingLevel?: "basic" | "detailed" | "comprehensive";
  sets: MatchSet[];
  report?: MatchReport;
  createdAt: string;
  updatedAt: string;
  winner?: string;
  totalGameTime?: number;
  isDraft?: boolean;
  resumedCount?: number;
  p1Status?: string;
  p2Status?: string;
  lastSavedAt?: string;
  courtSurface: "clay" | "hard" | "grass" | "carpet" | "other";
  indoor: boolean;
  note?: string;
  date: string;
  tieBreakRule: number;
}

export interface CreateMatchRequest {
  p1?: string;
  p2?: string;
  p1IsObject: boolean;
  p2IsObject: boolean;
  p1Name?: string;
  p2Name?: string;
  courtSurface: "clay" | "hard" | "grass" | "carpet" | "other";
  indoor?: boolean;
  note?: string;
  date: string;
  matchType: "one" | "three" | "five";
  matchCategory: "practice" | "tournament";
  tournamentType?: string;
  tournamentLevel?: string;
  tieBreakRule?: number;
}

export interface UpdateMatchStatusRequest {
  playerStatus: "accepted" | "rejected";
}

export interface SaveMatchProgressRequest {
  trackingLevel: "level1" | "level2" | "level3";
  sets: MatchSetData[];
}

export interface SubmitMatchResultRequest {
  trackingLevel: "level1" | "level2" | "level3";
  totalGameTime: number; // Total game time in seconds
  sets: MatchSetData[];
}

export interface MatchesListResponse {
  matches: Match[];
}

export interface MatchDetailResponse {
  match: Match;
}

export interface MatchQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  matchType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Matches API Service
class MatchesService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Create a new tennis match
   * POST /api/v1/matches
   */
  async createMatch(matchData: CreateMatchRequest): Promise<MatchesListResponse> {
    try {
      const response = await axiosInstance.post<MatchesListResponse>('/api/v1/matches', matchData);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in createMatch:', error);
      throw error;
    }
  }

  /**
   * Get all matches with optional filtering and pagination
   * GET /api/v1/matches
   */
  async getMatches(params?: MatchQueryParams): Promise<MatchesListResponse> {
    try {
      const response = await axiosInstance.get<MatchesListResponse>('/api/v1/matches', {
        params
      });
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getMatches:', error);
      throw error;
    }
  }

  /**
   * Get a specific match by ID
   * GET /api/v1/matches/:id
   */
  async getMatchById(matchId: string): Promise<Match> {
    try {
      const response = await axiosInstance.get<Match>(`/api/v1/matches/${matchId}`);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getMatchById:', error);
      throw error;
    }
  }

  /**
   * Update a player's acceptance status for a match
   * PATCH /api/v1/matches/:id/status
   */
  async updateMatchStatus(matchId: string, statusData: UpdateMatchStatusRequest): Promise<Match> {
    try {
      const response = await axiosInstance.patch<Match>(`/api/v1/matches/${matchId}/status`, statusData);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in updateMatchStatus:', error);
      throw error;
    }
  }

  /**
   * Delete a match
   * DELETE /api/v1/matches/:id
   */
  async deleteMatch(matchId: string): Promise<MatchesListResponse> {
    try {
      const response = await axiosInstance.delete<MatchesListResponse>(`/api/v1/matches/${matchId}`);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in deleteMatch:', error);
      throw error;
    }
  }

  /**
   * Get completed matches only
   * GET /api/v1/matches/completed
   */
  async getCompletedMatches(params?: MatchQueryParams): Promise<MatchesListResponse> {
    try {
      const response = await axiosInstance.get<MatchesListResponse>('/api/v1/matches/completed', {
        params
      });
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getCompletedMatches:', error);
      throw error;
    }
  }

  /**
   * Get saved matches (drafts that can be resumed)
   * GET /api/v1/matches/saved
   */
  async getSavedMatches(params?: MatchQueryParams): Promise<MatchesListResponse> {
    try {
      const response = await axiosInstance.get<MatchesListResponse>('/api/v1/matches/saved', {
        params
      });
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getSavedMatches:', error);
      throw error;
    }
  }

  /**
   * Get matches by status
   */
  async getMatchesByStatus(status: Match['status'], params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, status };
    return this.getMatches(queryParams);
  }

  /**
   * Get matches by type
   */
  async getMatchesByType(matchType: Match['matchType'], params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, matchType };
    return this.getMatches(queryParams);
  }

  /**
   * Get matches by category
   */
  async getMatchesByCategory(matchCategory: Match['matchCategory'], params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, matchCategory };
    return this.getMatches(queryParams);
  }

  /**
   * Get matches by date range
   */
  async getMatchesByDateRange(startDate: string, endDate: string, params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, startDate, endDate };
    return this.getMatches(queryParams);
  }

  /**
   * Get matches by court surface
   */
  async getMatchesByCourtSurface(courtSurface: Match['courtSurface'], params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, courtSurface };
    return this.getMatches(queryParams);
  }

  /**
   * Get pending matches count
   */
  async getPendingMatchesCount(): Promise<number> {
    try {
      const response = await this.getMatchesByStatus('pending', { limit: 1 });
      return response.matches?.length || 0;
    } catch (error) {
      console.error('Error getting pending matches count:', error);
      return 0;
    }
  }

  /**
   * Get completed matches count
   */
  async getCompletedMatchesCount(): Promise<number> {
    try {
      const response = await this.getCompletedMatches({ limit: 1 });
      return response.matches?.length || 0;
    } catch (error) {
      console.error('Error getting completed matches count:', error);
      return 0;
    }
  }

  /**
   * Get upcoming matches (pending and accepted)
   */
  async getUpcomingMatches(params?: MatchQueryParams): Promise<MatchesListResponse> {
    try {
      const [pendingMatches, acceptedMatches] = await Promise.all([
        this.getMatchesByStatus('pending', params),
        this.getMatchesByStatus('accepted', params)
      ]);

      return {
        matches: [...pendingMatches.matches, ...acceptedMatches.matches]
      };
    } catch (error) {
      console.error('Error getting upcoming matches:', error);
      throw error;
    }
  }

  /**
   * Get player's match history
   */
  async getPlayerMatchHistory(playerId: string, params?: MatchQueryParams): Promise<MatchesListResponse> {
    try {
      // This would need to be implemented based on your API structure
      // You might need to filter matches where p1._id === playerId || p2._id === playerId
      const response = await this.getMatches(params);
      
      // Filter matches for the specific player
      const playerMatches = response.matches.filter(match => {
        const p1Id = typeof match.p1 === 'string' ? match.p1 : match.p1?._id;
        const p2Id = typeof match.p2 === 'string' ? match.p2 : match.p2?._id;
        return p1Id === playerId || p2Id === playerId;
      });

      return { matches: playerMatches };
    } catch (error) {
      console.error('Error getting player match history:', error);
      throw error;
    }
  }

  /**
   * Get match statistics for a player
   */
  async getPlayerMatchStats(playerId: string): Promise<{
    totalMatches: number;
    wins: number;
    losses: number;
    winPercentage: number;
    totalSets: number;
    totalGames: number;
  }> {
    try {
      const playerMatches = await this.getPlayerMatchHistory(playerId);
      const completedMatches = playerMatches.matches.filter(match => match.status === 'completed');

      let wins = 0;
      let totalSets = 0;
      let totalGames = 0;

      completedMatches.forEach(match => {
        if (match.report) {
          const isPlayer1 = typeof match.p1 === 'string' ? match.p1 === playerId : match.p1?._id === playerId;
          const isWinner = (isPlayer1 && match.report.winner === 'p1') || 
                          (!isPlayer1 && match.report.winner === 'p2');
          
          if (isWinner) wins++;
          
          totalSets += match.report.totalSets;
          totalGames += match.report.totalGames;
        }
      });

      const totalMatches = completedMatches.length;
      const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

      return {
        totalMatches,
        wins,
        losses: totalMatches - wins,
        winPercentage: Math.round(winPercentage * 100) / 100,
        totalSets,
        totalGames
      };
    } catch (error) {
      console.error('Error getting player match stats:', error);
      throw error;
    }
  }

  /**
   * Format match date for display
   */
  formatMatchDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting match date:', error);
      return dateString;
    }
  }

  /**
   * Format match time for display
   */
  formatMatchTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting match time:', error);
      return '';
    }
  }

  /**
   * Get match duration in a readable format
   */
  formatMatchDuration(duration: string): string {
    // Assuming duration is in format like "2h 30m" or "90m"
    return duration;
  }

  /**
   * Get court surface display name
   */
  getCourtSurfaceDisplayName(courtSurface: Match['courtSurface']): string {
    const surfaceNames = {
      clay: 'Clay',
      hard: 'Hard Court',
      grass: 'Grass',
      carpet: 'Carpet',
      other: 'Other'
    };
    return surfaceNames[courtSurface] || courtSurface;
  }

  /**
   * Get match type display name
   */
  getMatchTypeDisplayName(matchType: Match['matchType']): string {
    const typeNames = {
      one: 'Best of 1',
      three: 'Best of 3',
      five: 'Best of 5'
    };
    return typeNames[matchType] || matchType;
  }

  /**
   * Get match category display name
   */
  getMatchCategoryDisplayName(matchCategory: Match['matchCategory']): string {
    const categoryNames = {
      practice: 'Practice Match',
      tournament: 'Tournament Match'
    };
    return categoryNames[matchCategory] || matchCategory;
  }

  /**
   * Check if match is upcoming (within next 7 days)
   */
  isMatchUpcoming(matchDate: string): boolean {
    try {
      const matchDateObj = new Date(matchDate);
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      return matchDateObj >= now && matchDateObj <= sevenDaysFromNow;
    } catch (error) {
      console.error('Error checking if match is upcoming:', error);
      return false;
    }
  }

  /**
   * Check if match is today
   */
  isMatchToday(matchDate: string): boolean {
    try {
      const matchDateObj = new Date(matchDate);
      const today = new Date();
      
      return matchDateObj.toDateString() === today.toDateString();
    } catch (error) {
      console.error('Error checking if match is today:', error);
      return false;
    }
  }

  /**
   * Get match status display name
   */
  getMatchStatusDisplayName(status: Match['status']): string {
    const statusNames = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return statusNames[status] || status;
  }

  /**
   * Get match status color for UI
   */
  getMatchStatusColor(status: Match['status']): string {
    const statusColors = {
      pending: 'text-yellow-600 bg-yellow-100',
      accepted: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100',
      in_progress: 'text-blue-600 bg-blue-100',
      completed: 'text-gray-600 bg-gray-100',
      cancelled: 'text-red-600 bg-red-100'
    };
    return statusColors[status] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Save match progress with tracking data
   */
  async saveMatchProgress(matchId: string, data: SaveMatchProgressRequest): Promise<MatchesListResponse> {
    try {
      const response = await axiosInstance.post<MatchesListResponse>(`/api/v1/matches/${matchId}/save-progress`, data);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in saveMatchProgress:', error);
      throw error;
    }
  }

  /**
   * Submit final match result with tracking data
   */
  async submitMatchResult(matchId: string, data: SubmitMatchResultRequest): Promise<MatchesListResponse> {
    try {
      const response = await axiosInstance.post<MatchesListResponse>(`/api/v1/matches/${matchId}/submit`, data);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in submitMatchResult:', error);
      throw error;
    }
  }
}

// Create and export instance
export const matchesService = new MatchesService();

import axiosInstance from "@/config/axios.config";

// Types for Matches module based on Enhanced API response
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

// New Enhanced Match Format Types
export type MatchFormat = 
  | 'oneSet'
  | 'bestOfThree'
  | 'bestOfFive'
  | 'shortSets'
  | 'proSet8'
  | 'tiebreak7'
  | 'tiebreak10'
  | 'tiebreak21';

export type ScoringVariation = 
  | 'standard'
  | 'finalSetTiebreak10'
  | 'oneSetTiebreak10';

export type TrackingLevel = 'level1' | 'level2' | 'level3';

export type MatchStatus = 
  | 'pending'
  | 'confirmed'
  | 'inProgress'
  | 'saved'
  | 'completed'
  | 'cancelled';

export interface MatchFormatConfig {
  format: MatchFormat;
  description: string;
  maxSets: number;
  setsToWin: number;
  gamesPerSet: number;
  tiebreakAt: number;
  defaultTiebreakRule: number;
  noAdScoring: boolean;
  trackingLevels: TrackingLevel[];
}

export interface ScoringVariationConfig {
  variation: ScoringVariation;
  description: string;
}

export interface MatchFormatStats {
  totalMatches: number;
  formatDistribution: Record<MatchFormat, number>;
  averageMatchDuration: Record<MatchFormat, number>;
}

export interface MatchFormatCategories {
  traditional: MatchFormat[];
  short: MatchFormat[];
  tiebreakOnly: MatchFormat[];
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

// Legacy MatchScore interface - keeping for backward compatibility
export interface LegacyMatchScore {
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
  scores: LegacyMatchScore[];
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
  // Legacy field - deprecated but still supported
  matchType?: "one" | "three" | "five";
  // New enhanced fields
  matchFormat: MatchFormat;
  scoringVariation: ScoringVariation;
  customTiebreakRules?: Record<string, number>;
  noAdScoring: boolean;
  trackingLevel: TrackingLevel;
  matchCategory: "practice" | "tournament";
  tournamentType?: string;
  tournamentLevel?: string;
  status: MatchStatus;
  sets: MatchSet[];
  report?: MatchReport;
  p1MatchReport?: PlayerMatchReport;
  p2MatchReport?: PlayerMatchReport;
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
  // Legacy field - deprecated but still supported
  matchType?: "one" | "three" | "five";
  // New enhanced fields
  matchFormat: MatchFormat;
  scoringVariation: ScoringVariation;
  customTiebreakRules?: Record<string, number>;
  noAdScoring?: boolean;
  trackingLevel: TrackingLevel;
  matchCategory: "practice" | "tournament";
  tournamentType?: string;
  tournamentLevel?: string;
  tieBreakRule?: number;
}

export interface UpdateMatchStatusRequest {
  playerStatus: "accepted" | "rejected";
}

export interface SaveMatchProgressRequest {
  trackingLevel: TrackingLevel;
  sets: MatchSetData[];
}

export interface SubmitMatchResultRequest {
  trackingLevel: TrackingLevel;
  totalGameTime: number; // Total game time in seconds
  sets: MatchSetData[];
}

// Enhanced Score Objects based on tracking level
export interface Level1Score {
  p1Score: string;
  p2Score: string;
  pointWinner: "playerOne" | "playerTwo";
}

export interface Level2Score extends Level1Score {
  isSecondService?: boolean;
  type?: string;
  servePlacement?: string;
  p1Reaction?: string;
  p2Reaction?: string;
}

export interface Level3Score extends Level2Score {
  missedShot?: string;
  placement?: string;
  missedShotWay?: string;
  betweenPointDuration?: number;
  rallies?: string;
  courtPosition?: string;
}

export type EnhancedMatchScore = Level1Score | Level2Score | Level3Score;

// Enhanced Player Match Report
export interface PlayerMatchReport {
  service: {
    totalServices: number;
    firstServicePercentage: number;
    secondServicePercentage: number;
    aces: number;
    doubleFaults: number;
    firstServices: number;
    secondServices: number;
  };
  points: {
    totalPointsWon: number;
    winners: number;
    unforcedErrors: number;
    forcedErrors: number;
  };
  rallies: {
    oneToFour: number;
    fiveToEight: number;
    nineToTwelve: number;
    thirteenToTwenty: number;
    twentyOnePlus: number;
  };
  conversion: {
    firstServicePointsWon: number;
    secondServicePointsWon: number;
    receivingPointsWon: number;
    breakPoints: number;
    gamePoints: number;
  };
}

export interface MatchDetailResponse {
  match: Match;
}

export interface MatchQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  // Legacy field - deprecated but still supported
  matchType?: string;
  // New enhanced fields
  format?: MatchFormat;
  status?: MatchStatus;
  startDate?: string;
  endDate?: string;
  trackingLevel?: TrackingLevel;
  scoringVariation?: ScoringVariation;
}

// New API Response Types
export interface MatchesListResponse {
  matches: Match[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MatchFormatResponse {
  formats: MatchFormatConfig[];
}

export interface MatchFormatCategoriesResponse {
  categories: MatchFormatCategories;
}

export interface ScoringVariationsResponse {
  variations: ScoringVariationConfig[];
}

export interface MatchFormatStatsResponse {
  stats: MatchFormatStats;
}

export interface MatchFormatMatchesResponse {
  format: MatchFormat;
  matches: Match[];
  count: number;
}

// Matches API Service
class MatchesService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Create a new tennis match with enhanced format support
   * POST /api/v1/matches
   */
  async createMatch(matchData: CreateMatchRequest): Promise<{ match: Match }> {
    try {
      const response = await axiosInstance.post<{ match: Match }>('/api/v1/matches', matchData);
      
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
   * Get all matches with enhanced filtering and pagination
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
   * Get completed matches for a specific player
   * GET /api/v1/matches/:playerId/completed
   */
  async getPlayerCompletedMatches(playerId: string, params?: MatchQueryParams): Promise<MatchesListResponse> {
    try {
      const response = await axiosInstance.get<MatchesListResponse>(`/api/v1/matches/${playerId}/completed`, {
        params
      });
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getPlayerCompletedMatches:', error);
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
  async getMatchesByStatus(status: MatchStatus, params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, status };
    return this.getMatches(queryParams);
  }

  /**
   * Get matches by format (new enhanced method)
   */
  async getMatchesByFormat(format: MatchFormat, params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, format };
    return this.getMatches(queryParams);
  }

  /**
   * Get matches by type (legacy method - deprecated)
   */
  async getMatchesByType(matchType: "one" | "three" | "five", params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, matchType };
    return this.getMatches(queryParams);
  }

  /**
   * Get matches by category
   */
  async getMatchesByCategory(matchCategory: "practice" | "tournament", params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, matchCategory };
    return this.getMatches(queryParams);
  }

  /**
   * Get matches by tracking level
   */
  async getMatchesByTrackingLevel(trackingLevel: TrackingLevel, params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, trackingLevel };
    return this.getMatches(queryParams);
  }

  /**
   * Get matches by scoring variation
   */
  async getMatchesByScoringVariation(scoringVariation: ScoringVariation, params?: MatchQueryParams): Promise<MatchesListResponse> {
    const queryParams = { ...params, scoringVariation };
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
  async getMatchesByCourtSurface(courtSurface: "clay" | "hard" | "grass" | "carpet" | "other", params?: MatchQueryParams): Promise<MatchesListResponse> {
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
   * Get upcoming matches (pending and confirmed)
   */
  async getUpcomingMatches(params?: MatchQueryParams): Promise<MatchesListResponse> {
    try {
      const [pendingMatches, confirmedMatches] = await Promise.all([
        this.getMatchesByStatus('pending', params),
        this.getMatchesByStatus('confirmed', params)
      ]);

      return {
        matches: [...pendingMatches.matches, ...confirmedMatches.matches]
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
   * Get match format display name (new enhanced method)
   */
  getMatchFormatDisplayName(matchFormat: MatchFormat): string {
    const formatNames = {
      oneSet: 'One Set',
      bestOfThree: 'Best of 3 Sets',
      bestOfFive: 'Best of 5 Sets',
      shortSets: 'Short Sets (4/7)',
      proSet8: '8-Game Pro Set',
      tiebreak7: '7-Point Tiebreak',
      tiebreak10: '10-Point Tiebreak',
      tiebreak21: '21-Point Tiebreak'
    };
    return formatNames[matchFormat] || matchFormat;
  }

  /**
   * Get match type display name (legacy method - deprecated)
   */
  getMatchTypeDisplayName(matchType: 'one' | 'three' | 'five'): string {
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
  getMatchCategoryDisplayName(matchCategory: 'practice' | 'tournament'): string {
    const categoryNames = {
      practice: 'Practice Match',
      tournament: 'Tournament Match'
    };
    return categoryNames[matchCategory] || matchCategory;
  }

  /**
   * Get scoring variation display name
   */
  getScoringVariationDisplayName(scoringVariation: ScoringVariation): string {
    const variationNames = {
      standard: 'Standard Scoring',
      finalSetTiebreak10: 'Final Set 10-Point Tiebreak',
      oneSetTiebreak10: 'Single Set 10-Point Tiebreak'
    };
    return variationNames[scoringVariation] || scoringVariation;
  }

  /**
   * Get tracking level display name
   */
  getTrackingLevelDisplayName(trackingLevel: TrackingLevel): string {
    const levelNames = {
      level1: 'Basic Tracking',
      level2: 'Intermediate Tracking',
      level3: 'Advanced Tracking'
    };
    return levelNames[trackingLevel] || trackingLevel;
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
  getMatchStatusDisplayName(status: MatchStatus): string {
    const statusNames = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      inProgress: 'In Progress',
      saved: 'Saved',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return statusNames[status] || status;
  }

  /**
   * Get match status color for UI
   */
  getMatchStatusColor(status: MatchStatus): string {
    const statusColors = {
      pending: 'text-yellow-600 bg-yellow-100',
      confirmed: 'text-green-600 bg-green-100',
      inProgress: 'text-blue-600 bg-blue-100',
      saved: 'text-purple-600 bg-purple-100',
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
   * Resume a saved match
   */
  async resumeMatch(matchId: string): Promise<Match> {
    try {
      const response = await axiosInstance.post<Match>(`/api/v1/matches/${matchId}/resume`);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in resumeMatch:', error);
      throw error;
    }
  }

  /**
   * Clear/reset match data
   */
  async clearMatch(matchId: string): Promise<Match> {
    try {
      const response = await axiosInstance.post<Match>(`/api/v1/matches/${matchId}/clear`);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in clearMatch:', error);
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

  // NEW: Match Format Discovery Methods

  /**
   * Get all available match formats
   * GET /api/v1/matches/formats
   */
  async getMatchFormats(): Promise<MatchFormatResponse> {
    try {
      const response = await axiosInstance.get<MatchFormatResponse>('/api/v1/matches/formats');
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getMatchFormats:', error);
      throw error;
    }
  }

  /**
   * Get match formats organized by categories
   * GET /api/v1/matches/formats/categories
   */
  async getMatchFormatCategories(): Promise<MatchFormatCategoriesResponse> {
    try {
      const response = await axiosInstance.get<MatchFormatCategoriesResponse>('/api/v1/matches/formats/categories');
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getMatchFormatCategories:', error);
      throw error;
    }
  }

  /**
   * Get available scoring variations
   * GET /api/v1/matches/formats/variations
   */
  async getScoringVariations(): Promise<ScoringVariationsResponse> {
    try {
      const response = await axiosInstance.get<ScoringVariationsResponse>('/api/v1/matches/formats/variations');
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getScoringVariations:', error);
      throw error;
    }
  }

  /**
   * Get match format usage statistics
   * GET /api/v1/matches/formats/stats
   */
  async getMatchFormatStats(): Promise<MatchFormatStatsResponse> {
    try {
      const response = await axiosInstance.get<MatchFormatStatsResponse>('/api/v1/matches/formats/stats');
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getMatchFormatStats:', error);
      throw error;
    }
  }

  /**
   * Get matches by specific format
   * GET /api/v1/matches/formats/:format
   */
  async getMatchesByFormatEndpoint(format: MatchFormat, params?: MatchQueryParams): Promise<MatchFormatMatchesResponse> {
    try {
      const response = await axiosInstance.get<MatchFormatMatchesResponse>(`/api/v1/matches/formats/${format}`, {
        params
      });
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getMatchesByFormatEndpoint:', error);
      throw error;
    }
  }

  // Utility Methods for New Features

  /**
   * Check if match format is compatible with scoring variation
   */
  isFormatCompatibleWithVariation(format: MatchFormat, variation: ScoringVariation): boolean {
    const compatibility = {
      oneSet: ['standard', 'oneSetTiebreak10'],
      bestOfThree: ['standard', 'finalSetTiebreak10'],
      bestOfFive: ['standard', 'finalSetTiebreak10'],
      shortSets: ['standard'],
      proSet8: ['standard'],
      tiebreak7: ['standard'],
      tiebreak10: ['standard'],
      tiebreak21: ['standard']
    };
    
    return compatibility[format]?.includes(variation) || false;
  }

  /**
   * Get recommended tracking level for match format
   */
  getRecommendedTrackingLevel(format: MatchFormat): TrackingLevel {
    const recommendations = {
      oneSet: 'level1' as TrackingLevel,
      bestOfThree: 'level2' as TrackingLevel,
      bestOfFive: 'level3' as TrackingLevel,
      shortSets: 'level1' as TrackingLevel,
      proSet8: 'level1' as TrackingLevel,
      tiebreak7: 'level1' as TrackingLevel,
      tiebreak10: 'level2' as TrackingLevel,
      tiebreak21: 'level2' as TrackingLevel
    };
    
    return recommendations[format] || 'level2';
  }

  /**
   * Get estimated match duration for format
   */
  getEstimatedMatchDuration(format: MatchFormat): number {
    const durations = {
      oneSet: 45, // minutes
      bestOfThree: 90,
      bestOfFive: 180,
      shortSets: 60,
      proSet8: 75,
      tiebreak7: 10,
      tiebreak10: 15,
      tiebreak21: 30
    };
    
    return durations[format] || 90;
  }

  /**
   * Validate match format configuration
   */
  validateMatchFormatConfig(config: CreateMatchRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check format and variation compatibility
    if (!this.isFormatCompatibleWithVariation(config.matchFormat, config.scoringVariation)) {
      errors.push(`${config.scoringVariation} scoring variation is not compatible with ${config.matchFormat} format`);
    }
    
    // Check custom tiebreak rules
    if (config.customTiebreakRules) {
      Object.entries(config.customTiebreakRules).forEach(([set, points]) => {
        if (points < 7 || points > 21) {
          errors.push(`Custom tiebreak rule for set ${set} must be between 7 and 21 points`);
        }
      });
    }
    
    // Check date is in future
    if (new Date(config.date) <= new Date()) {
      errors.push('Match date must be in the future');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create and export instance
export const matchesService = new MatchesService();

// Types are already exported individually above - no need for re-export

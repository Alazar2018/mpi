import axiosInstance from "@/config/axios.config";
import { API_CONFIG } from "@/config/api.config";
import { matchesService } from "./matchs.server";
import { playersService } from "./players.server";

// Types for Dashboard data based on actual API response
export interface DashboardUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'player' | 'coach' | 'parent' | 'admin';
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  zipCode?: string;
  lastOnline?: string;
  createdAt: string;
  updatedAt: string;
}

// Simple dashboard stats based on actual API response
export interface DashboardStats {
  competitions: number;
  won: number;
  lost: number;
  // Calculated fields
  totalMatches?: number;
  winRate?: number;
  totalSessions?: number;
  totalPoints?: number;
  pointsWon?: number;
  pointsLost?: number;
  firstServePercentage?: number;
  secondServePercentage?: number;
  averageMatchDuration?: number;
  totalPlayTime?: number;
  currentStreak?: number;
  bestStreak?: number;
  ranking?: number;
  level?: string;
}

export interface ServeData {
  wide: number;
  t: number;
  body: number;
  net: number;
  total: number;
}

export interface ServeStats {
  firstServe: ServeData;
  secondServe: ServeData;
  aces: ServeData;
  firstServeWon: number;
  firstServeLost: number;
  secondServeWon: number;
  secondServeLost: number;
  totalPoints: number;
  pointsWon: number;
  pointsLost: number;
  // Calculated percentages
  firstServePercentage: number;
  secondServePercentage: number;
}

export interface MatchData {
  _id: string;
  matchId: string;
  opponent: string;
  opponentId: string | null;
  date: string;
  duration: number;
  result: 'won' | 'lost' | 'draw' | 'in_progress';
  score: string;
  sets: Array<{
    setNumber: number;
    playerScore: number;
    opponentScore: number;
    winner: 'player' | 'opponent' | null;
  }>;
  serveStats: ServeStats;
  location?: string;
  courtSurface?: string;
  matchType?: string;
  notes?: string;
}

export interface PlayerMatchData {
  playerId: string;
  matchId: string;
  data: MatchData;
}

// Actual API response structure
export interface DashboardResponse {
  competitions: number;
  won: number;
  lost: number;
  // Additional fields that might be present
  user?: DashboardUser;
  stats?: DashboardStats;
  recentMatches?: MatchData[];
  upcomingMatches?: MatchData[];
  serveStats?: ServeStats;
  performanceTrends?: {
    date: string;
    winRate: number;
    pointsWon: number;
    pointsLost: number;
  }[];
}

export interface PlayerDashboardResponse {
  playerId: string;
  user: DashboardUser;
  stats: DashboardStats;
  matches: MatchData[];
  serveStats: ServeStats;
  performanceTrends: {
    date: string;
    winRate: number;
    pointsWon: number;
    pointsLost: number;
  }[];
}

// Dashboard API Service
class DashboardService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Get dashboard data for the authenticated user
   * GET /api/v1/dashboard/me
   */
  async getMyDashboard(): Promise<DashboardResponse> {
    try {
      const response = await axiosInstance.get<DashboardResponse>(API_CONFIG.ENDPOINTS.DASHBOARD.ME);
      
      // Transform the simple API response to include calculated fields
      const dashboardData = response.data;
      const enhancedData: DashboardResponse = {
        ...dashboardData,
        stats: {
          competitions: dashboardData.competitions,
          won: dashboardData.won,
          lost: dashboardData.lost,
          totalMatches: dashboardData.competitions,
          winRate: dashboardData.competitions > 0 ? Math.round((dashboardData.won / dashboardData.competitions) * 100) : 0,
          totalSessions: dashboardData.competitions, // Using competitions as sessions for now
          totalPoints: 0, // Will be calculated from matches
          pointsWon: 0, // Will be calculated from matches
          pointsLost: 0, // Will be calculated from matches
        }
      };

      return enhancedData;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return fallback data
      return {
        competitions: 0,
        won: 0,
        lost: 0,
        stats: {
          competitions: 0,
          won: 0,
          lost: 0,
          totalMatches: 0,
          winRate: 0,
          totalSessions: 0,
          totalPoints: 0,
          pointsWon: 0,
          pointsLost: 0,
        }
      };
    }
  }

  /**
   * Get match data by match ID
   * GET /api/v1/dashboard/matches/:matchId
   */
  async getMatchData(matchId: string): Promise<MatchData> {
    try {
      const match = await matchesService.getMatchById(matchId);
      return this.transformMatchToDashboardFormat(match);
    } catch (error) {
      console.error('Error fetching match data:', error);
      throw error;
    }
  }

  /**
   * Get match data for a specific player and match
   * GET /api/v1/dashboard/:playerId/matches/:matchId
   */
  async getPlayerMatchData(playerId: string, matchId: string): Promise<PlayerMatchData> {
    try {
      const match = await matchesService.getMatchById(matchId);
      const transformedMatch = this.transformMatchToDashboardFormat(match);
      
      return {
        playerId,
        matchId,
        data: transformedMatch
      };
    } catch (error) {
      console.error('Error fetching player match data:', error);
      throw error;
    }
  }

  /**
   * Get all matches for a specific player
   * GET /api/v1/dashboard/:playerId/matches
   */
  async getPlayerMatches(playerId: string): Promise<MatchData[]> {
    try {
      const matchesResponse = await matchesService.getMatches();
      const playerMatches = matchesResponse.matches.filter(match => {
        const p1Id = typeof match.p1 === 'string' ? match.p1 : match.p1?._id;
        const p2Id = typeof match.p2 === 'string' ? match.p2 : match.p2?._id;
        return p1Id === playerId || p2Id === playerId;
      });

      return playerMatches.map(match => this.transformMatchToDashboardFormat(match));
    } catch (error) {
      console.error('Error fetching player matches:', error);
      throw error;
    }
  }

  /**
   * Get matches for the current authenticated user
   * This method will be called from the frontend with the user ID
   */
  async getCurrentUserMatches(userId: string): Promise<{
    recentMatches: MatchData[];
    upcomingMatches: MatchData[];
    allMatches: MatchData[];
  }> {
    try {
      const matchesResponse = await matchesService.getMatches();
      if (!matchesResponse.matches || matchesResponse.matches.length === 0) {
        return {
          recentMatches: [],
          upcomingMatches: [],
          allMatches: []
        };
      }

      // Filter matches where the current user is either player 1 or player 2
      const userMatches = matchesResponse.matches.filter(match => {
        const p1Id = typeof match.p1 === 'string' ? match.p1 : match.p1?._id;
        const p2Id = typeof match.p2 === 'string' ? match.p2 : match.p2?._id;
        return p1Id === userId || p2Id === userId;
      });

      // Transform all matches
      const allMatches = userMatches.map(match => this.transformMatchToDashboardFormat(match));

      // Get recent completed matches
      const recentMatches = allMatches
        .filter(match => match.result !== 'in_progress')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      // Get upcoming/pending matches
      const upcomingMatches = allMatches
        .filter(match => match.result === 'in_progress')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

      return {
        recentMatches,
        upcomingMatches,
        allMatches
      };
    } catch (error) {
      console.error('Error fetching current user matches:', error);
      return {
        recentMatches: [],
        upcomingMatches: [],
        allMatches: []
      };
    }
  }

  /**
   * Get player dashboard data (for coaches/parents viewing player data)
   * GET /api/v1/dashboard/:playerId
   */
  async getPlayerDashboard(playerId: string): Promise<PlayerDashboardResponse> {
    try {
      const [playerResponse, matchesResponse] = await Promise.all([
        playersService.getPlayerById(playerId),
        this.getPlayerMatches(playerId)
      ]);

      const player = playerResponse.player;
      const matches = matchesResponse;

      // Calculate player stats from matches
      const completedMatches = matches.filter(match => match.result !== 'in_progress');
      const wins = completedMatches.filter(match => match.result === 'won').length;
      const totalMatches = completedMatches.length;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      const stats: DashboardStats = {
        competitions: totalMatches,
        won: wins,
        lost: totalMatches - wins,
        totalMatches,
        winRate,
        totalSessions: totalMatches,
        totalPoints: 0,
        pointsWon: 0,
        pointsLost: 0,
      };

      return {
        playerId,
        user: {
          _id: player._id,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.emailAddress.email,
          role: 'player' as const,
          avatar: player.avatar,
          lastOnline: player.lastOnline,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        stats,
        matches,
        serveStats: this.getDefaultServeStats(),
        performanceTrends: []
      };
    } catch (error) {
      console.error('Error fetching player dashboard:', error);
      throw error;
    }
  }

  /**
   * Transform match from matches service format to dashboard format
   */
  private transformMatchToDashboardFormat(match: any): MatchData {
    // Determine opponent name based on p2IsObject flag
    const opponent = match.p2IsObject 
      ? `${match.p2?.firstName || ''} ${match.p2?.lastName || ''}`.trim()
      : match.p2Name || 'Unknown Opponent';

    // Determine match result based on winner field and status
    let result: 'won' | 'lost' | 'draw' | 'in_progress';
    if (match.status === 'completed' && match.winner) {
      if (match.winner === 'playerOne') {
        result = 'won';
      } else if (match.winner === 'playerTwo') {
        result = 'lost';
      } else {
        result = 'draw';
      }
    } else if (match.status === 'pending' || match.status === 'saved') {
      result = 'in_progress';
    } else {
      result = 'in_progress';
    }

    // Format score based on sets
    const score = this.formatMatchScore(match);

    // Extract serve stats from match report if available
    const serveStats = this.extractServeStatsFromMatch(match);

    return {
      _id: match._id,
      matchId: match._id,
      opponent,
      opponentId: match.p2IsObject ? match.p2?._id : null,
      date: match.date,
      duration: match.totalGameTime || 0,
      result,
      score,
      sets: match.sets?.map((set: any, index: number) => ({
        setNumber: index + 1,
        playerScore: set.p1TotalScore || 0,
        opponentScore: set.p2TotalScore || 0,
        winner: set.winner === 'playerOne' ? 'player' : 'opponent'
      })) || [],
      serveStats,
      location: match.courtSurface,
      courtSurface: match.courtSurface,
      matchType: match.matchType,
      notes: match.note
    };
  }

  /**
   * Format match score based on sets
   */
  private formatMatchScore(match: any): string {
    if (!match.sets || match.sets.length === 0) {
      return '0-0';
    }

    const playerSets = match.sets.filter((set: any) => set.winner === 'playerOne').length;
    const opponentSets = match.sets.filter((set: any) => set.winner === 'playerTwo').length;
    
    return `${playerSets}-${opponentSets}`;
  }

  /**
   * Extract serve stats from match report if available
   */
  private extractServeStatsFromMatch(match: any): ServeStats {
    if (match.p1MatchReport && match.p1MatchReport.service) {
      const report = match.p1MatchReport;
      const service = report.service;
      
      const firstServeWon = service.firstServesWon || 0;
      const firstServeLost = service.firstServesLost || 0;
      const secondServeWon = service.secondServesWon || 0;
      const secondServeLost = service.secondServesLost || 0;
      
      // Calculate percentages
      const firstServePercentage = (firstServeWon + firstServeLost) > 0 
        ? Math.round((firstServeWon / (firstServeWon + firstServeLost)) * 100) 
        : 0;
      const secondServePercentage = (secondServeWon + secondServeLost) > 0 
        ? Math.round((secondServeWon / (secondServeWon + secondServeLost)) * 100) 
        : 0;
      
      return {
        firstServe: {
          wide: match.report?.firstServePlacement?.p1?.wide || 0,
          t: match.report?.firstServePlacement?.p1?.t || 0,
          body: match.report?.firstServePlacement?.p1?.body || 0,
          net: match.report?.firstServePlacement?.p1?.net || 0,
          total: service.firstServices || 0
        },
        secondServe: {
          wide: match.report?.secondServePlacement?.p1?.wide || 0,
          t: match.report?.secondServePlacement?.p1?.t || 0,
          body: match.report?.secondServePlacement?.p1?.body || 0,
          net: match.report?.secondServePlacement?.p1?.net || 0,
          total: service.secondServices || 0
        },
        aces: {
          wide: match.report?.acesPlacement?.p1?.wide || 0,
          t: match.report?.acesPlacement?.p1?.t || 0,
          body: match.report?.acesPlacement?.p1?.body || 0,
          net: match.report?.acesPlacement?.p1?.net || 0,
          total: service.aces || 0
        },
        firstServeWon,
        firstServeLost,
        secondServeWon,
        secondServeLost,
        totalPoints: match.report?.points?.total || 0,
        pointsWon: match.report?.points?.p1?.won || 0,
        pointsLost: (match.report?.points?.total || 0) - (match.report?.points?.p1?.won || 0),
        firstServePercentage,
        secondServePercentage
      };
    }

    // Return default stats if no match report available
    return this.getDefaultServeStats();
  }

  /**
   * Get default serve stats when real data is not available
   */
  private getDefaultServeStats(): ServeStats {
    const firstServeWon = 25;
    const firstServeLost = 14;
    const secondServeWon = 15;
    const secondServeLost = 24;
    
    // Calculate percentages
    const firstServePercentage = Math.round((firstServeWon / (firstServeWon + firstServeLost)) * 100);
    const secondServePercentage = Math.round((secondServeWon / (secondServeWon + secondServeLost)) * 100);
    
    return {
      firstServe: { wide: 8, t: 24, body: 2, net: 5, total: 39 },
      secondServe: { wide: 8, t: 24, body: 2, net: 5, total: 39 },
      aces: { wide: 8, t: 24, body: 2, net: 5, total: 39 },
      firstServeWon,
      firstServeLost,
      secondServeWon,
      secondServeLost,
      totalPoints: 78,
      pointsWon: 40,
      pointsLost: 38,
      firstServePercentage,
      secondServePercentage
    };
  }

  /**
   * Calculate win rate from matches
   */
  calculateWinRate(matches: MatchData[]): number {
    if (matches.length === 0) return 0;
    const wonMatches = matches.filter(match => match.result === 'won').length;
    return Math.round((wonMatches / matches.length) * 100);
  }

  /**
   * Calculate total points from serve stats
   */
  calculateTotalPoints(serveStats: ServeStats): number {
    return serveStats.totalPoints;
  }

  /**
   * Calculate serve percentage
   */
  calculateServePercentage(serveStats: ServeStats, serveType: 'first' | 'second'): number {
    if (serveType === 'first') {
      const total = serveStats.firstServeWon + serveStats.firstServeLost;
      return total > 0 ? Math.round((serveStats.firstServeWon / total) * 100) : 0;
    } else {
      const total = serveStats.secondServeWon + serveStats.secondServeLost;
      return total > 0 ? Math.round((serveStats.secondServeWon / total) * 100) : 0;
    }
  }

  /**
   * Get serve placement percentages
   */
  getServePlacementPercentages(serveData: ServeData): Record<string, number> {
    const { wide, t, body, net, total } = serveData;
    return {
      wide: total > 0 ? Math.round((wide / total) * 100) : 0,
      t: total > 0 ? Math.round((t / total) * 100) : 0,
      body: total > 0 ? Math.round((body / total) * 100) : 0,
      net: total > 0 ? Math.round((net / total) * 100) : 0,
    };
  }

  /**
   * Get recent performance trend
   */
  getRecentPerformanceTrend(performanceTrends: { date: string; winRate: number }[]): 'improving' | 'declining' | 'stable' {
    if (performanceTrends.length < 2) return 'stable';
    
    const recent = performanceTrends.slice(-3);
    const first = recent[0].winRate;
    const last = recent[recent.length - 1].winRate;
    
    if (last > first + 5) return 'improving';
    if (last < first - 5) return 'declining';
    return 'stable';
  }

  /**
   * Format match duration
   */
  formatMatchDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Get match result color
   */
  getMatchResultColor(result: string): string {
    switch (result) {
      case 'won':
        return 'text-green-600';
      case 'lost':
        return 'text-red-600';
      case 'draw':
        return 'text-yellow-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Get serve stats summary
   */
  getServeStatsSummary(serveStats: ServeStats): {
    totalServes: number;
    successfulServes: number;
    successRate: number;
    acesCount: number;
  } {
    const totalServes = serveStats.firstServeWon + serveStats.firstServeLost + 
                       serveStats.secondServeWon + serveStats.secondServeLost;
    const successfulServes = serveStats.firstServeWon + serveStats.secondServeWon;
    const successRate = totalServes > 0 ? Math.round((successfulServes / totalServes) * 100) : 0;
    const acesCount = serveStats.aces.total;

    return {
      totalServes,
      successfulServes,
      successRate,
      acesCount,
    };
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(stats: DashboardStats, recentMatches: MatchData[]): {
    strength: string;
    weakness: string;
    recommendation: string;
  } {
    let strength = 'Consistent performance';
    let weakness = 'No major weaknesses detected';
    let recommendation = 'Keep up the good work!';

    if (stats.winRate && stats.winRate < 50) {
      weakness = 'Win rate below 50%';
      recommendation = 'Focus on improving match strategy and mental game';
    }

    if (stats.firstServePercentage && stats.firstServePercentage < 60) {
      weakness = 'Low first serve percentage';
      recommendation = 'Practice first serve accuracy and consistency';
    }

    if (stats.winRate && stats.winRate > 80) {
      strength = 'Excellent win rate';
      recommendation = 'Consider competing at higher levels';
    }

    if (stats.currentStreak && stats.currentStreak > 5) {
      strength = 'Strong winning streak';
      recommendation = 'Maintain momentum and confidence';
    }

    return { strength, weakness, recommendation };
  }
}

// Create and export instance
export const dashboardService = new DashboardService();

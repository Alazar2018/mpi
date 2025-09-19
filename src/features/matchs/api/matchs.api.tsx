import { matchesService } from "@/service/matchs.server";
import type { 
  MatchesListResponse, 
  SaveMatchProgressRequest,
  SubmitMatchResultRequest,
  MatchQueryParams,
  MatchFormat,
  ScoringVariation,
  TrackingLevel,
  MatchFormatResponse,
  MatchFormatCategoriesResponse,
  ScoringVariationsResponse,
  MatchFormatStatsResponse,
  MatchFormatMatchesResponse,
  CreateMatchRequest
} from "@/service/matchs.server";
import type { AsyncResponse } from "@/interface";

// Wrapper functions that return AsyncResponse for useApiRequest compatibility
export function getAllMatchs(query: MatchQueryParams = {}): Promise<AsyncResponse<MatchesListResponse>> {
	return matchesService.getMatches(query).then(data => ({
		success: true,
		data,
		status: 200
	})).catch(error => ({
		success: false,
		error: error.message || 'Failed to fetch matches',
		status: 500
	}));
}

export function getMatchById(matchId: string): Promise<AsyncResponse<any>> {
	return matchesService.getMatchById(matchId).then(data => ({
		success: true,
		data,
		status: 200
	})).catch(error => ({
		success: false,
		error: error.message || 'Failed to fetch match',
		status: 500
	}));
}

export function createMatch(matchData: CreateMatchRequest): Promise<AsyncResponse<{ match: any }>> {
	return matchesService.createMatch(matchData).then(data => ({
		success: true,
		data,
		status: 200
	})).catch(error => {
		console.error('createMatch API error:', error);
		
		// Extract the actual server error message
		let errorMessage = 'Failed to create match';
		
		if (error.response?.data?.message) {
			// Server returned a specific error message
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			// Alternative error field
			errorMessage = error.response.data.error;
		} else if (error.message) {
			// Fallback to axios error message
			errorMessage = error.message;
		}
		
		return {
			success: false,
			error: errorMessage,
			status: error.response?.status || 500
		};
	});
}

export function updateMatchStatus(matchId: string, status: "confirmed" | "rejected"): Promise<AsyncResponse<any>> {
	return matchesService.updateMatchStatus(matchId, { playerStatus: status as "accepted" | "rejected" }).then(data => ({
		success: true,
		data,
		status: 200
	})).catch(error => ({
		success: false,
		error: error.message || 'Failed to update match status',
		status: 500
	}));
}

export function deleteMatch(matchId: string): Promise<AsyncResponse<MatchesListResponse>> {
	return matchesService.deleteMatch(matchId).then(data => ({
		success: true,
		data,
		status: 200
	})).catch(error => ({
		success: false,
		error: error.message || 'Failed to delete match',
		status: 500
	}));
}

export function getCompletedMatches(query: MatchQueryParams = {}): Promise<AsyncResponse<MatchesListResponse>> {
	return matchesService.getCompletedMatches(query).then(data => ({
		success: true,
		data,
		status: 200
	})).catch(error => ({
		success: false,
		error: error.message || 'Failed to fetch completed matches',
		status: 500
	}));
}

export function getSavedMatches(query: MatchQueryParams = {}): Promise<AsyncResponse<MatchesListResponse>> {
	return matchesService.getSavedMatches(query).then(data => ({
		success: true,
		data,
		status: 200
	})).catch(error => ({
		success: false,
		error: error.message || 'Failed to fetch saved matches',
		status: 500
	}));
}

export function getUpcomingMatches(query: MatchQueryParams = {}): Promise<AsyncResponse<MatchesListResponse>> {
	return matchesService.getUpcomingMatches(query).then(data => ({
		success: true,
		data,
		status: 200
	})).catch(error => ({
		success: false,
		error: error.message || 'Failed to fetch upcoming matches',
		status: 500
	}));
}

/**
 * Save match progress with tracking data
 */
export const saveMatchProgress = async (matchId: string, data: SaveMatchProgressRequest): Promise<AsyncResponse<MatchesListResponse>> => {
  try {
    const response = await matchesService.saveMatchProgress(matchId, data);
    return {
      success: true,
      data: response,
      message: 'Match progress saved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save match progress',
      message: 'Failed to save match progress'
    };
  }
};

/**
 * Submit final match result with tracking data
 */
export const submitMatchResult = async (matchId: string, data: SubmitMatchResultRequest): Promise<AsyncResponse<MatchesListResponse>> => {
  try {
    const response = await matchesService.submitMatchResult(matchId, data);
    return {
      success: true,
      data: response,
      message: 'Match result submitted successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit match result',
      message: 'Failed to submit match result'
    };
  }
};

// NEW: Enhanced Match Format API Methods

/**
 * Get all available match formats
 */
export const getMatchFormats = async (): Promise<AsyncResponse<MatchFormatResponse>> => {
  try {
    const response = await matchesService.getMatchFormats();
    return {
      success: true,
      data: response,
      message: 'Match formats retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get match formats',
      message: 'Failed to get match formats'
    };
  }
};

/**
 * Get match formats organized by categories
 */
export const getMatchFormatCategories = async (): Promise<AsyncResponse<MatchFormatCategoriesResponse>> => {
  try {
    const response = await matchesService.getMatchFormatCategories();
    return {
      success: true,
      data: response,
      message: 'Match format categories retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get match format categories',
      message: 'Failed to get match format categories'
    };
  }
};

/**
 * Get available scoring variations
 */
export const getScoringVariations = async (): Promise<AsyncResponse<ScoringVariationsResponse>> => {
  try {
    const response = await matchesService.getScoringVariations();
    return {
      success: true,
      data: response,
      message: 'Scoring variations retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scoring variations',
      message: 'Failed to get scoring variations'
    };
  }
};

/**
 * Get match format usage statistics
 */
export const getMatchFormatStats = async (): Promise<AsyncResponse<MatchFormatStatsResponse>> => {
  try {
    const response = await matchesService.getMatchFormatStats();
    return {
      success: true,
      data: response,
      message: 'Match format stats retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get match format stats',
      message: 'Failed to get match format stats'
    };
  }
};

/**
 * Get matches by specific format
 */
export const getMatchesByFormat = async (format: MatchFormat, params?: MatchQueryParams): Promise<AsyncResponse<MatchFormatMatchesResponse>> => {
  try {
    const response = await matchesService.getMatchesByFormatEndpoint(format, params);
    return {
      success: true,
      data: response,
      message: 'Matches by format retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get matches by format',
      message: 'Failed to get matches by format'
    };
  }
};

/**
 * Resume a saved match
 */
export const resumeMatch = async (matchId: string): Promise<AsyncResponse<any>> => {
  try {
    const response = await matchesService.resumeMatch(matchId);
    return {
      success: true,
      data: response,
      message: 'Match resumed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume match',
      message: 'Failed to resume match'
    };
  }
};

/**
 * Clear/reset match data
 */
export const clearMatch = async (matchId: string): Promise<AsyncResponse<any>> => {
  try {
    const response = await matchesService.clearMatch(matchId);
    return {
      success: true,
      data: response,
      message: 'Match cleared successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear match',
      message: 'Failed to clear match'
    };
  }
};

/**
 * Get completed matches for a specific player
 */
export const getPlayerCompletedMatches = async (playerId: string, params?: MatchQueryParams): Promise<AsyncResponse<MatchesListResponse>> => {
  try {
    const response = await matchesService.getPlayerCompletedMatches(playerId, params);
    return {
      success: true,
      data: response,
      message: 'Player completed matches retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get player completed matches',
      message: 'Failed to get player completed matches'
    };
  }
};

/**
 * Get matches by tracking level
 */
export const getMatchesByTrackingLevel = async (trackingLevel: TrackingLevel, params?: MatchQueryParams): Promise<AsyncResponse<MatchesListResponse>> => {
  try {
    const response = await matchesService.getMatchesByTrackingLevel(trackingLevel, params);
    return {
      success: true,
      data: response,
      message: 'Matches by tracking level retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get matches by tracking level',
      message: 'Failed to get matches by tracking level'
    };
  }
};

/**
 * Get matches by scoring variation
 */
export const getMatchesByScoringVariation = async (scoringVariation: ScoringVariation, params?: MatchQueryParams): Promise<AsyncResponse<MatchesListResponse>> => {
  try {
    const response = await matchesService.getMatchesByScoringVariation(scoringVariation, params);
    return {
      success: true,
      data: response,
      message: 'Matches by scoring variation retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get matches by scoring variation',
      message: 'Failed to get matches by scoring variation'
    };
  }
};
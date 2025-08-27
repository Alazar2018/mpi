import { matchesService } from "@/service/matchs.server";
import type { 
  MatchesListResponse, 
  SaveMatchProgressRequest,
  SubmitMatchResultRequest,
  MatchQueryParams
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

export function createMatch(matchData: any): Promise<AsyncResponse<MatchesListResponse>> {
	return matchesService.createMatch(matchData).then(data => ({
		success: true,
		data,
		status: 200
	})).catch(error => ({
		success: false,
		error: error.message || 'Failed to create match',
		status: 500
	}));
}

export function updateMatchStatus(matchId: string, status: "accepted" | "rejected"): Promise<AsyncResponse<any>> {
	return matchesService.updateMatchStatus(matchId, { playerStatus: status }).then(data => ({
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
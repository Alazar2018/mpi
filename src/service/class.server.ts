import { axiosInstance } from '@/config/axios.config';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface Player {
  _id: string;
  firstName: string;
  lastName: string;
  emailAddress?: {
    email: string;
  };
}

export interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  emailAddress?: {
    email: string;
  };
}

export interface Attendance {
  player: string;
  status: 'present' | 'absent' | 'pending' | 'late' | 'excused';
  date?: string;
}

export interface Performance {
  engagement: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
  effort: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
  execution: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
}

export interface CoachEvaluation {
  measurement: string;
  achievable: boolean;
  isRelevant: boolean;
  isTimeBound: boolean;
  goal: string;
  performance: Performance;
  additionalInfo?: string;
}

export interface PlayerEvaluation {
  performance: Performance;
  additionalInfo?: string;
}

export interface PlayerReflection {
  P: number; // Purpose 1-5
  R: number; // Relevance 1-5
  I: number; // Interest 1-5
  M: number; // Motivation 1-5
  stepsTaken?: string;
  feelTowardsGoal?: string;
  additionalInfo?: string;
}

export interface PreSessionQuestions {
  emotion: number; // 1-5
  energy: number; // 1-5
  engagement: number; // 1-5
  additionalInfo?: string;
}

export interface PlacementDetails {
  crossCourtForehand?: number;
  crossCourtBackhand?: number;
  downTheLineForehand?: number;
  downTheLineBackhand?: number;
  shortCrossCourtForehand?: number;
  shortCrossCourtBackhand?: number;
  dropShotForehand?: number;
  dropShotBackhand?: number;
  lobForehand?: number;
  lobBackhand?: number;
  total?: number;
}

export interface ConsistencyResult {
  rallyLength1to4?: number;
  rallyLength5to8?: number;
  rallyLength9Plus?: number;
  total: number;
}

export interface ClassObjective {
  objective: 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery';
  subObjective: string;
  nestedSubObjective?: string;
  technicalStroke?: string;
  technicalProblem?: string;
  videoUrl?: string;
  tacticsType?: string;
  placementDetails?: PlacementDetails;
  consistencyResult?: ConsistencyResult;
  additionalInfo?: string;
}

export interface Class {
  _id: string;
  coach: Coach;
  players: Player[];
  date: string;
  to: string;
  levelPlan: string;
  goal?: string;
  status: 'active' | 'cancelled' | 'completed';
  attendance: Attendance[];
  objectives: ClassObjective[];
  evaluations: CoachEvaluation[];
  reflections: PlayerReflection[];
  preSessionQuestions: PreSessionQuestions[];
  videos: string[];
  photos: string[];
  sessionType: 'private' | 'semi' | 'group';
  playersCanReflect?: boolean;
  feedback?: string;
  checkList?: {
    survey: boolean;
    mindfulness: boolean;
    imagery: boolean;
    stretching: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassRequest {
  players: string[];
  date: string;
  to: string;
  levelPlan: string;
  goal?: string;
  objectives: ClassObjective;
}

export interface UpdateClassRequest {
  date?: string;
  to?: string;
  levelPlan?: string;
  status?: 'active' | 'cancelled';
  feedback?: string;
  objectives?: ClassObjective;
}

export interface AddPlayersRequest {
  players: string[];
}

export interface MarkAttendanceRequest {
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface UpdateAvailabilityRequest {
  response: 'confirmed' | 'rejected';
  reason?: string;
}

export interface AddCoachEvaluationRequest {
  measurement: string;
  achievable: boolean;
  isRelevant: boolean;
  isTimeBound: boolean;
  goal: string;
  performance: Performance;
  additionalInfo?: string;
}

export interface AddPlayerEvaluationRequest {
  performance: Performance;
  additionalInfo?: string;
}

export interface AddPlayerReflectionRequest {
  P: number;
  R: number;
  I: number;
  M: number;
  stepsTaken?: string;
  feelTowardsGoal?: string;
  additionalInfo?: string;
}

export interface AddPreSessionQuestionsRequest {
  emotion: number;
  energy: number;
  engagement: number;
  additionalInfo?: string;
}

export interface AddClassObjectiveRequest {
  objective: 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery';
  subObjective: string;
  nestedSubObjective?: string;
  technicalStroke?: string;
  technicalProblem?: string;
  videoUrl?: string;
  tacticsType?: string;
  placementDetails?: PlacementDetails;
  consistencyResult?: ConsistencyResult;
  additionalInfo?: string;
}

export interface UpdateActualResultsRequest {
  actualResults: {
    placementActual?: PlacementDetails;
    consistencyActual?: ConsistencyResult;
  };
}

export interface UpdatePlacementResultsRequest {
  placementActual: PlacementDetails;
}

export interface UpdateConsistencyResultsRequest {
  consistencyActual: ConsistencyResult;
}

export interface ClassListResponse {
  classes: Class[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ObjectiveOptionsResponse {
  objectives: {
    physical: string[];
    technical: string[];
    tactics: string[];
    mental: string[];
    recovery: string[];
  };
  technicalStrokes: string[];
  tacticsOptions: {
    consistency: string[];
    placement: string[];
    gamePlan: string[];
    gameStyle: string[];
    fiveGameSituations: string[];
    anticipation: string[];
    percentagePlay: string[];
    reducingUnforcedErrors: string[];
    ruleNumberOne: string[];
    workingWeakness: string[];
  };
}

export interface PerformanceReportResponse {
  classId: string;
  classDate: string;
  objective: string;
  subObjective: string;
  tacticsType?: string;
  placementReport?: {
    planned: PlacementDetails;
    actual: PlacementDetails;
    performance: Record<string, {
      planned: number;
      actual: number;
      percentage: number;
      status: 'met' | 'below' | 'exceeded';
    }>;
    overall: {
      planned: number;
      actual: number;
      percentage: number;
      status: 'met' | 'below' | 'exceeded';
    };
  };
  consistencyReport?: {
    planned: ConsistencyResult;
    actual: ConsistencyResult;
    performance: Record<string, {
      planned: number;
      actual: number;
      percentage: number;
      status: 'met' | 'below' | 'exceeded';
    }>;
    overall: {
      planned: number;
      actual: number;
      percentage: number;
      status: 'met' | 'below' | 'exceeded';
    };
    tacticsType: string;
  };
}

// ============================================================================
// CLASS SERVICE
// ============================================================================

class ClassService {
  private baseURL = '/api/v1/classes';

  // ========================================================================
  // BASIC CRUD OPERATIONS
  // ========================================================================

  /**
   * Create a new tennis class/session
   */
  async createClass(data: CreateClassRequest): Promise<Class[]> {
    const response = await axiosInstance.post(this.baseURL, data);
    return response.data;
  }

  /**
   * Get all classes for the authenticated user
   */
  async getMyClasses(
    page: number = 1,
    limit: number = 10,
    sort?: string,
    status?: string
  ): Promise<ClassListResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (sort) params.append('sort', sort);
    if (status) params.append('status', status);

    const response = await axiosInstance.get(`${this.baseURL}?${params.toString()}`);
    return response.data;
  }

  /**
   * Get a single class by ID
   */
  async getClass(id: string): Promise<Class> {
    const response = await axiosInstance.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  /**
   * Update class details
   */
  async updateClass(id: string, data: UpdateClassRequest): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a class
   */
  async deleteClass(id: string): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.delete(`${this.baseURL}/${id}`);
    return response.data;
  }

  // ========================================================================
  // PLAYER MANAGEMENT
  // ========================================================================

  /**
   * Add players to an existing class
   */
  async addPlayersToClass(id: string, data: AddPlayersRequest): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.post(`${this.baseURL}/${id}/players`, data);
    return response.data;
  }

  /**
   * Remove a player from the class
   */
  async removePlayerFromClass(id: string, playerId: string): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.delete(`${this.baseURL}/${id}/players/${playerId}`);
    return response.data;
  }

  /**
   * Mark attendance for a specific player
   */
  async markAttendance(
    id: string,
    playerId: string,
    data: MarkAttendanceRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/players/${playerId}`, data);
    return response.data;
  }

  // ========================================================================
  // CLASS STATUS MANAGEMENT
  // ========================================================================

  /**
   * Update player availability (accept/reject invitation)
   */
  async updatePlayerAvailability(
    id: string,
    data: UpdateAvailabilityRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/availability`, data);
    return response.data;
  }

  /**
   * Cancel a class
   */
  async cancelClass(id: string): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/cancel`);
    return response.data;
  }

  /**
   * Activate a cancelled class
   */
  async activateClass(id: string): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/activate`);
    return response.data;
  }

  /**
   * Complete a class
   */
  async completeClass(id: string): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/complete`);
    return response.data;
  }

  // ========================================================================
  // EVALUATIONS & REFLECTIONS
  // ========================================================================

  /**
   * Add coach evaluation for a player
   */
  async addCoachEvaluation(
    id: string,
    playerId: string,
    data: AddCoachEvaluationRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.post(
      `${this.baseURL}/${id}/addCoachEvaluation/${playerId}`,
      data
    );
    return response.data;
  }

  /**
   * Add player self-evaluation
   */
  async addPlayerEvaluation(
    id: string,
    data: AddPlayerEvaluationRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.post(`${this.baseURL}/${id}/addPlayerEvaluation`, data);
    return response.data;
  }

  /**
   * Add player reflection using PRIM framework
   */
  async addPlayerReflection(
    id: string,
    data: AddPlayerReflectionRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.post(`${this.baseURL}/${id}/addPlayerReflection`, data);
    return response.data;
  }

  /**
   * Add pre-session questions
   */
  async addPreSessionQuestions(
    id: string,
    data: AddPreSessionQuestionsRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.post(`${this.baseURL}/${id}/addPreSessionQuestions`, data);
    return response.data;
  }

  // ========================================================================
  // OBJECTIVES MANAGEMENT
  // ========================================================================

  /**
   * Add objective to a class
   */
  async addClassObjective(
    id: string,
    data: AddClassObjectiveRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.post(`${this.baseURL}/${id}/addClassObjective`, data);
    return response.data;
  }

  /**
   * Update an existing objective
   */
  async updateClassObjective(
    id: string,
    objectiveId: string,
    data: Partial<AddClassObjectiveRequest>
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(
      `${this.baseURL}/${id}/objectives/${objectiveId}`,
      data
    );
    return response.data;
  }

  /**
   * Remove an objective from the class
   */
  async removeClassObjective(id: string, objectiveId: string): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.delete(`${this.baseURL}/${id}/objectives/${objectiveId}`);
    return response.data;
  }

  /**
   * Get available objective options for the frontend
   */
  async getObjectiveOptions(): Promise<ObjectiveOptionsResponse> {
    const response = await axiosInstance.get(`${this.baseURL}/objectives/options`);
    return response.data;
  }

  /**
   * Get available technical stroke options
   */
  async getTechnicalStrokeOptions(): Promise<{ technicalStrokes: string[] }> {
    const response = await axiosInstance.get(`${this.baseURL}/objectives/technical-strokes`);
    return response.data;
  }

  /**
   * Get available tactics options
   */
  async getTacticsOptions(): Promise<{ tacticsOptions: any }> {
    const response = await axiosInstance.get(`${this.baseURL}/objectives/tactics-options`);
    return response.data;
  }

  // ========================================================================
  // MEDIA MANAGEMENT
  // ========================================================================

  /**
   * Upload videos to a class
   */
  async addClassVideos(id: string, formData: FormData): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.post(`${this.baseURL}/${id}/classVideos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Remove videos from a class
   */
  async removeClassVideos(id: string, videoUrls: string[]): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.delete(`${this.baseURL}/${id}/classVideos`, {
      data: { videoUrls },
    });
    return response.data;
  }

  /**
   * Upload photos to a class
   */
  async addClassPhotos(id: string, formData: FormData): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.post(`${this.baseURL}/${id}/classPhotos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Remove photos from a class
   */
  async removeClassPhotos(id: string, photoUrls: string[]): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.delete(`${this.baseURL}/${id}/classPhotos`, {
      data: { photoUrls },
    });
    return response.data;
  }

  // ========================================================================
  // CHECKLIST MANAGEMENT
  // ========================================================================

  /**
   * Update mindfulness checklist
   */
  async updateMindfulnessChecklist(id: string): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/checkList/mindfulness`);
    return response.data;
  }

  /**
   * Update imagery checklist
   */
  async updateImageryChecklist(id: string): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/checkList/imagery`);
    return response.data;
  }

  /**
   * Update stretching checklist
   */
  async updateStretchingChecklist(id: string): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/checkList/stretching`);
    return response.data;
  }

  /**
   * Enable/disable player reflections for the class
   */
  async enablePlayerReflections(id: string, enabled: boolean): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/playersCanReflect`, {
      enabled,
    });
    return response.data;
  }

  // ========================================================================
  // ADDITIONAL ENDPOINTS
  // ========================================================================

  /**
   * Get all classes for a specific player (coaches only)
   */
  async getPlayerClasses(playerId: string): Promise<ClassListResponse> {
    const response = await axiosInstance.get(`${this.baseURL}/player/${playerId}`);
    return response.data;
  }

  /**
   * Get all classes for a child (parents only)
   */
  async getChildClasses(childId: string): Promise<ClassListResponse> {
    const response = await axiosInstance.get(`${this.baseURL}/child/${childId}`);
    return response.data;
  }

  // ========================================================================
  // PERFORMANCE & RESULTS (Future Use)
  // ========================================================================

  /**
   * Update actual performance results achieved during a class
   */
  async updateActualResults(
    id: string,
    data: UpdateActualResultsRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/actualResults`, data);
    return response.data;
  }

  /**
   * Update only placement actual results
   */
  async updatePlacementResults(
    id: string,
    data: UpdatePlacementResultsRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(`${this.baseURL}/${id}/actualResults/placement`, data);
    return response.data;
  }

  /**
   * Update only consistency actual results
   */
  async updateConsistencyResults(
    id: string,
    data: UpdateConsistencyResultsRequest
  ): Promise<{ classes: Class[] }> {
    const response = await axiosInstance.patch(
      `${this.baseURL}/${id}/actualResults/consistency`,
      data
    );
    return response.data;
  }

  /**
   * Generate performance report comparing planned vs actual results
   */
  async getPerformanceReport(id: string): Promise<PerformanceReportResponse> {
    const response = await axiosInstance.get(`${this.baseURL}/${id}/performanceReport`);
    return response.data;
  }
}

// ============================================================================
// EXPORT SERVICE INSTANCE
// ============================================================================

export const classService = new ClassService();
export default classService;
